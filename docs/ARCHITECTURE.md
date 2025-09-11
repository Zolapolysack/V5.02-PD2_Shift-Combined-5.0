# PD2_Shift-Combined – Architecture

This document describes the system architecture, code layout, execution model, integration contracts, and extension points of the PD2_Shift-Combined project. It is intended for engineers who will maintain or extend the system.

## 1. Scope and Objectives

The application is a browser-based operations console for Production Dept. 2. It consolidates multiple functional modules:
- Shift A data entry
- Shift B data entry
- Fabric roll cutting (ตัดม้วน)
- Reporting (Google Sheets backed)

There is no application server. The system is a static site served by a lightweight development server. Persistence and reporting rely on Google Sheets integrations implemented in the module pages.

## 2. Repository Layout

- `index.html`: Shell application hosting the unified console. It renders the navigation, frame container, and shared logic.
- `pd2-notify.js`: Shared notification library (toast + centered success overlay).
- `ปรับ script PD2_Shift-A_V4.0/index.html`: Shift A module.
- `ปรับ script PD2_Shift-B_V4.0/index.html`: Shift B module.
- `ตัดม้วน PD2/index.html`: Fabric cut module.
- `link google sheet/index.html`: Reporting module.
- `dev/watch-and-reload.js`: Developer file watcher and WebSocket-based reload broadcaster.
- `health.html`: Minimal read-only capability and environment health page.
- `__tests__/pd2-notify.test.js`: Unit tests for the notifications module.
- `package.json`: Development scripts and dev dependencies.

Auxiliary folders such as `assets/`, `docs/`, and `legacy/` hold static assets and documentation.

## 3. Execution Model

- The shell page `index.html` is loaded in the browser.
- A top-level navigation presents four module choices. Selecting a module sets the `src` of an embedded `<iframe id="shiftFrame">` to that module's `index.html`.
- A navigation controller manages state, loading indicators, retries, and de-duplication of rapid clicks.
- The shell and the active module communicate with `window.postMessage` using a small protocol.

There is no framework; the implementation is vanilla JavaScript plus Tailwind CSS (via CDN) for styling.

## 4. Shell Composition (`index.html`)

Key components:
- Header and navigation (pill-styled buttons).
- Frame wrapper (`.frame-wrap`) that sizes to the visual viewport with mobile adjustments.
- Loading overlay displayed during module changes.
- Notification mounts (`#notifications`, `#toast`).
- A development WebSocket client (optional) that listens for `reload` events.

The shell defines a minimal design system with CSS custom properties and Tailwind utilities.

## 5. Module System (Iframes)

Module resolution is centralized by two helpers:
- `pathFor(target)`: Returns the relative URL to the module page for `A`, `B`, `CUT`, or `REPORT`.
- `buttonFor(target)`: Returns the pill button element corresponding to the target.

The `navigateTo(target, opts)` function:
- Guards against repeated selection of the same module unless forced.
- Debounces rapid clicks when a navigation is already in progress.
- Shows a loading overlay and scrolls the workbench into view.
- Updates the URL hash to support deep-linking.
- Sets `iframe.src` with a cache-busting query string.
- Arms both an `iframe.onload` listener and a temporary `postMessage` fast-path listener.
- Applies a watchdog timeout with a single retry using `force` if loading is slow.
- Syncs shared lists into the newly loaded iframe once ready.

### Navigation State

The navigation controller uses an opaque `token` to distinguish concurrent navigations and avoids acting on stale events. A simple state sketch:

- `navState = { busy: boolean, token: number, timer: number|undefined, retry: 0|1 }`
- Start: `busy=true`, `token++`, set timeout (10s)
- On load or ready message with matching token: clear timeout, `busy=false`, `retry=0`
- On timeout (and `retry===0`): do one forced retry
- On timeout after retry: surface a toast and restore controls

## 6. Messaging Protocol

The application uses `window.postMessage` for loosely-coupled communication. Messages are only honored when they originate from the active iframe to mitigate unintended cross-frame effects.

Message types emitted by modules or shell:

- `PD2_READY` (module -> shell)
  - Indicates that the module UI has rendered sufficiently. Shell may stop showing the loading overlay earlier than `iframe.onload`.

- `PD2_REQUEST_SYNC` (module -> shell)
  - Modules request a refresh of shared lists (machines, fabric sizes, employees).

- `PD2_ADD_CUSTOM` (module -> shell)
  - Payload: `{ category: 'machine'|'fabric'|'employee', data: { value? , id? , name? } }`
  - Shell will upsert the item into `SHARED` and broadcast to all iframes.

- `PD2_SYNC_CUSTOM` (shell -> modules)
  - Payload: `{ machines: string[], fabricSizes: string[], employees: Array<{id:string,name:string}> }`
  - Shell sends to all iframes or a specific target window.

- `PD2_CENTERED_SUCCESS` (module -> shell)
  - Payload: `{ count: number }`
  - Shell will display a centered success overlay via notifications.

Origin: The shell uses `location.origin` when posting messages (falls back to `*` if unavailable). Iframes are siblings, so same-origin is expected in normal operation.

## 7. Shared Data Model

`SHARED` is an in-memory, session-scoped store in the shell process:

```js
SHARED = {
  machines: string[],
  fabricSizes: string[],
  employees: Array<{ id: string, name: string }>
}
```

Utilities:
- `withSafeStr(v)` trims and coalesces nullish values to empty strings.
- `upsertShared(kind, data)` inserts into the corresponding list if not present.
- `broadcastShared(targetWin?)` sends `PD2_SYNC_CUSTOM` to all frames or one target.

## 8. Caching and Prefetching

- `CACHE_VER` (e.g., `20250903a1`) is appended to module URLs to prevent clients from serving stale iframes.
- On initial load, the shell also ensures a `cb=...` parameter on its own URL for the same reason.
- `prefetchModules()` runs during idle time to opportunistically warm the browser cache by `fetch()`ing module HTML (skipping the current module).

## 9. Mobile and Accessibility

- `applyMobileScrollLockToIframe(doc)` injects CSS and a conservative touch handler into iframes when the viewport width is small. This prevents unintended horizontal panning and layout overflow.
- `adjustForMobile()` sizes the frame to the `visualViewport` and nudges fixed UI (notifications) away from the virtual keyboard or unsafe areas.
- Interactive controls have `aria-*` attributes and focus styles to support keyboard navigation.

## 10. Notifications (`pd2-notify.js`)

Exports to `window`:
- `PD2Notify(message: string, type?: string)` – Toast notifications with deduplication and auto-dismiss.
- `PD2NotifyCenteredSuccess(count: number)` – High z-index centered success overlay; auto-dismisses after ~4.2s.

Implementation notes:
- Creates (or reuses) a `#notifications` container.
- Limits visible toasts (`maxVisible` ≈ 6).
- Accessible roles (`status` or `alert`) and `aria-live` regions are used.

## 11. Developer Tooling

- `dev/watch-and-reload.js` starts a WebSocket server on port `35729` and watches the three module trees. On file change, it broadcasts `{ type: 'reload', path, event }`.
- The shell (index.html) includes a lightweight WebSocket client to listen for reload messages. On receipt, it reloads the iframe with a timestamp query or reloads the parent as a fallback.

## 12. Security Considerations

- All inter-frame messages are typed; only messages from the active iframe are honored for mutating actions.
- The app is static and does not accept user-uploaded files.
- When integrating with Google Sheets, do not embed sensitive credentials in the client. Prefer a proxy service or use OAuth flows appropriate to the deployment environment.
- Serve over HTTPS in production to protect content and cookies.

## 13. Extension Points

- Add a new module by creating a sibling folder with an `index.html`, exposing the same postMessage contract if shared data is required. Update `pathFor()` and add a new pill button and event binding.
- Extend `SHARED` with additional lists by updating `upsertShared`, `broadcastShared`, and the message payload shapes.
- Replace the notification style or channel by swapping `pd2-notify.js` with a module preserving the same public API.

## 14. Known Limitations

- Browser-only architecture; long-running workflows or secure credential handling may require a backend.
- `meta[name=theme-color]` is not recognized by some browsers; it is cosmetic only.
- Inline styles exist in some places; move to a stylesheet if adopting a stricter lint policy.



เอกสารนี้สรุปโครงสร้างการทำงานของโปรเจกต์ PD2_Shift-Combined สำหรับผู้ดูแลหรือผู้พัฒนาต่อในอนาคต โดยเน้นประเด็นสำคัญที่ต้องรู้เพื่อการบำรุงรักษาและขยายระบบ

1. ขอบเขตและวัตถุประสงค์
- แอปพลิเคชันเป็นคอนโซลการปฏิบัติงานบนเบราว์เซอร์สำหรับฝ่ายผลิต (Production Dept. 2) ประกอบด้วยโมดูลบันทึกข้อมูลของกะงาน (Shift A / Shift B), โมดูลตัดม้วนผ้า และโมดูลรายงานที่ผสานกับ Google Sheets
- ระบบทำงานเป็น static site ไม่มี backend เฉพาะ; ข้อมูลและรายงานบางส่วนใช้ Google Sheets เป็นที่เก็บข้อมูล

2. เค้าโครงรีโพสิทอรี (ย่อ)
- `index.html`: หน้า shell หลัก จัดการการนำทางและฝังโมดูลผ่าน `<iframe>`
- `pd2-notify.js`: ไลบรารีแจ้งเตือนร่วม (toast, overlay)
- โฟลเดอร์โมดูล: `ปรับ script PD2_Shift-A_V4.0/`, `ปรับ script PD2_Shift-B_V4.0/`, `ตัดม้วน PD2/`, `link google sheet/`

3. รูปแบบการทำงานแบบย่อ
- หน้า shell จะเปลี่ยน `iframe.src` เป็นไฟล์ `index.html` ของโมดูลที่เลือก
- การสื่อสารระหว่าง shell และโมดูลใช้ `window.postMessage` ตามโปรโตคอลที่กำหนด

4. คอมโพเนนต์สำคัญ
- แถบนำทาง ปุ่มแบบ pill
- พื้นที่ iframe ที่ปรับขนาดตาม viewport
- overlay โหลด และ mount สำหรับแจ้งเตือน

5. ระบบนำทาง
- `navigateTo(target, opts)` มีการป้องกันการคลิกซ้ำ, ตั้ง timeout และทำ retry ครั้งหนึ่งเมื่อโหลดล่าช้า

6. โปรโตคอลการส่งข้อความ (รวบรวม)
- ประเภทหลัก: `PD2_READY`, `PD2_REQUEST_SYNC`, `PD2_ADD_CUSTOM`, `PD2_SYNC_CUSTOM`, `PD2_CENTERED_SUCCESS` — ใช้สำหรับซิงก์ข้อมูลและสถานะระหว่าง shell กับโมดูล

7. รูปแบบข้อมูลร่วม (SHARED)
- SHARED เก็บรายการเช่น `machines`, `fabricSizes`, `employees` เป็น store ชั่วคราวใน session และสามารถ upsert/broadcast ไปยัง iframe ได้

8. การแคชและ prefetch
- ค่า `CACHE_VER` ต่อเป็นพารามิเตอร์ใน URL เพื่อให้ผู้ใช้โหลดเวอร์ชันใหม่เมื่อมีการอัพเดต
- ฟังก์ชัน prefetch จะดึงหน้าโมดูลเข้ามาเพื่อวอร์มแคชในช่วง idle

9. การรองรับมือถือและการเข้าถึง
- มีการล็อคการเลื่อนและจัดการ visual viewport เมื่อเปิด iframe บนอุปกรณ์หน้าจอเล็ก
- คอนเทนต์มีการใช้ aria-* และ focus styles เพื่อช่วยเข้าถึงได้ดีขึ้น

10. จุดขยายระบบ
- เพิ่มโมดูลใหม่ได้โดยสร้างโฟลเดอร์ที่มี `index.html` และทำตาม contract การส่งข้อความ

11. ข้อจำกัดที่ทราบ
- เป็นแอปฝั่ง client ทั้งหมด หากต้องการจัดการสิทธิ์หรือเก็บข้อมูลที่ปลอดภัย ควรเพิ่ม backend

---



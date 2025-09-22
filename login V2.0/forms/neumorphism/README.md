# Neumorphism Login Form

*Created by [Aigars Silkalns](https://github.com/puikinsh/) for [Colorlib](https://colorlib.com)*

A soft UI login form featuring neumorphism design with embossed elements, soft shadows, and tactile interactions.

## Features

- **Neumorphic Design**: Soft UI with embossed and inset elements
- **Tactile Interactions**: Soft press effects and gentle animations
- **Ambient Lighting**: Mouse-responsive shadow effects
- **Soft Shadows**: Multi-layered shadows for depth illusion
- **Embossed Elements**: Buttons and inputs appear carved from surface
- **Gentle Animations**: Subtle, soft transitions throughout
- **SVG Icons**: Clean, scalable icons integrated seamlessly
- **Monochromatic Palette**: Subtle color variations for depth
- **Responsive**: Maintains neumorphic effects on all devices

## Files

- `index.html` - Main form HTML structure with neumorphic elements
- `style.css` - Complete self-contained CSS with neumorphic styling
- `script.js` - Soft interactions and ambient light effects
- `README.md` - This documentation

## Dependencies

- `../../shared/js/form-utils.js` - Shared form utilities (validation, animations)

## Usage

1. Copy the entire `neumorphism/` folder to your project
2. The form is completely self-contained with all CSS included
3. Only dependency is the shared JavaScript utilities
4. Customize by adjusting shadow colors and depths
5. Perfect for modern, soft UI applications
6. Integrate with your authentication system

## Quick Start

### Running the Form

1. Open `index.html` in your web browser
2. Or serve via HTTP server: `python -m http.server 8000`
3. Navigate to `http://localhost:8000/forms/neumorphism/`

### Integration

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your App - Login</title>
    <link rel="stylesheet" href="path/to/neumorphism/style.css">
</head>
<body>
    <!-- Include the form HTML -->
    <script src="path/to/shared/js/form-utils.js"></script>
    <script src="path/to/neumorphism/script.js"></script>
</body>
</html>
```

## Customization

### Neumorphic Color Palette
- Background: `#e0e5ec` (light gray base)
- Light Shadow: `#ffffff` (white highlights)
- Dark Shadow: `#bec3cf` (subtle dark shadows)
- Text Primary: `#3d4468` (dark blue-gray)
- Text Secondary: `#9499b7` (medium blue-gray)
- Accent: `#6c7293` (focused blue-gray)
- Success: `#00c896` (soft green)
- Error: `#ff3b5c` (soft red)

### Shadow Customization
- **Raised Elements**: Light shadow top-left, dark shadow bottom-right
- **Inset Elements**: Reversed shadow direction for depth illusion
- **Hover States**: Increased shadow distance for floating effect
- **Active States**: Inset shadows for pressed appearance

### Depth Levels
- **Level 1**: 4px shadows for subtle elevation
- **Level 2**: 8px shadows for standard elevation
- **Level 3**: 20px shadows for high elevation
- **Inset**: Negative shadows for recessed appearance

## Design Philosophy

Neumorphism creates the illusion that interface elements are carved from the same material as the background:

- **Soft Realism**: Elements appear physically embossed or carved
- **Minimal Contrast**: Subtle color variations maintain cohesion
- **Tactile Feedback**: Interactions feel like pressing physical buttons
- **Depth Hierarchy**: Shadow layers create natural information hierarchy
- **Ambient Light**: Mouse movement simulates changing light source

## Interactive Elements

- **Soft Press Effects**: Elements compress when pressed
- **Ambient Lighting**: Shadows respond to mouse position
- **Gentle Transitions**: All animations are soft and natural
- **Scale Animations**: Subtle scaling for hover feedback
- **Progressive Enhancement**: Graceful degradation on older browsers

## Accessibility Considerations

- **Low Contrast Warning**: Neumorphism can have accessibility issues
- **Focus Indicators**: Clear focus states for keyboard navigation
- **Color Independence**: Visual hierarchy doesn't rely solely on color
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast Mode**: Fallback styles for accessibility settings

## Browser Support

- Chrome 88+ (full support)
- Firefox 103+ (full support)
- Safari 15.4+ (full support)
- Edge 88+ (full support)

Requires modern CSS support for multiple box-shadows and CSS transforms.

## Perfect For

- Modern app interfaces
- Premium software applications
- iOS-style web applications
- Minimalist design systems
- Touch-first interfaces
- Creative portfolio sites
- Design tool interfaces
- Premium SaaS applications
- Modern dashboard designs
- Clean productivity apps

## Performance Notes

- Uses CSS transforms for smooth animations
- Multiple box-shadows optimized for hardware acceleration
- Minimal JavaScript for maximum performance
- Efficient DOM manipulation for interactive effects

## Limitations

- **Accessibility**: Low contrast may not meet WCAG standards
- **Dark Mode**: Neumorphism works best on light backgrounds
- **Print Styles**: Shadows don't translate well to print media
- **Legacy Browsers**: Requires modern CSS support

## Form Features

### Validation
- Real-time email validation
- Password strength checking
- Visual error states with neumorphic styling
- Gentle shake animations for errors

### Interactions
- Soft press effects on inputs
- Smooth floating labels
- Password visibility toggle
- Remember me checkbox
- Social login buttons (Google, GitHub, Twitter)

### Authentication Flow
1. Form validation
2. Loading states with neumorphic spinner
3. Success animation with soft transitions
4. Redirect simulation

## JavaScript API

```javascript
// Initialize the form
const loginForm = new NeumorphismLoginForm();

// Access form methods
loginForm.validateEmail();
loginForm.validatePassword();
loginForm.showError('email', 'Custom error message');
loginForm.clearError('email');
```

## CSS Variables

You can customize colors by modifying these CSS values in `style.css`:

```css
:root {
    --neu-background: #e0e5ec;
    --neu-shadow-dark: #bec3cf;
    --neu-shadow-light: #ffffff;
    --neu-text-primary: #3d4468;
    --neu-text-secondary: #9499b7;
    --neu-accent: #6c7293;
    --neu-success: #00c896;
    --neu-error: #ff3b5c;
}
```

## Testing

1. **Visual Testing**: Verify neumorphic effects across browsers
2. **Interaction Testing**: Test hover, focus, and click states
3. **Form Validation**: Test all validation scenarios
4. **Responsive Testing**: Check mobile and tablet layouts
5. **Accessibility Testing**: Screen reader and keyboard navigation

## Credits

Created by [Aigars Silkalns](https://github.com/puikinsh/) for [Colorlib](https://colorlib.com).

## License

This project is licensed under the MIT License - feel free to use it for personal and commercial projects.
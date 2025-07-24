# Dark/Light Mode Implementation

## Overview

This implementation adds comprehensive dark and light mode support to the MoodJournal application with the following features:

- **3 Theme Options**: Light, Dark, and System (auto-detect)
- **System Theme Detection**: Automatically detects and applies the user's system theme preference by default
- **User Preference Storage**: Saves theme preferences in Supabase for logged-in users
- **Cross-Device Sync**: Theme preferences sync across all user devices
- **Modern Styling**: Enhanced colors and modern appearance in both light and dark modes

## Features

### Theme Options

1. **System** (Default): Automatically follows the user's device theme settings
2. **Light**: Always uses light theme regardless of system settings
3. **Dark**: Always uses dark theme regardless of system settings

### User Experience

- **First-time users**: System theme is applied by default
- **Logged-in users**: Their saved preference is loaded and applied
- **Settings Integration**: Theme can be changed via the Settings page under the "Theme" tab
- **Instant Switching**: Theme changes apply immediately without page reload
- **Consistent Application**: Theme applies to all pages including dashboard, journal entries, calendar, analytics, and settings

## Technical Implementation

### Dependencies

- `next-themes`: Robust theme management for Next.js applications
- Tailwind CSS with dark mode support
- Supabase for user preference storage

### Key Components

#### 1. ThemeProvider (`components/providers/ThemeProvider.tsx`)
- Wraps the entire application
- Integrates next-themes with Supabase
- Loads user preferences on authentication
- Handles system theme detection

#### 2. ThemeSelector (`components/settings/ThemeSelector.tsx`)
- User interface for theme selection
- Saves preferences to Supabase
- Visual feedback for current selection
- Explanatory text for system theme behavior

#### 3. Database Schema
- Added `theme_preference` column to `profiles` table
- Supports 'light', 'dark', and 'system' values
- Default value is 'system'

### Styling Enhancements

#### CSS Variables
The implementation uses CSS custom properties for consistent theming:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 262.1 83.3% 57.8%;
  /* ... more variables */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 263.4 70% 50.4%;
  /* ... dark mode overrides */
}
```

#### Enhanced Mood Colors
Special attention was given to mood-related colors for optimal readability and modern appearance:

**Light Mode:**
- **Excellent**: Deep emerald green (#059669) - professional and calming
- **Good**: Forest green (#65A30D) - natural and positive
- **Neutral**: Amber orange (#D97706) - warm and readable (replaces problematic yellow)
- **Poor**: Strong red (#DC2626) - clear warning indication
- **Terrible**: Deep red (#B91C1C) - urgent attention

**Dark Mode:**
- **Excellent**: Bright emerald (#34D399) - enhanced visibility
- **Good**: Bright lime (#A3E635) - vibrant and positive
- **Neutral**: Golden yellow (#FBBF24) - warm and visible
- **Poor**: Bright orange (#FB923C) - clear contrast
- **Terrible**: Coral red (#F87171) - gentle but noticeable

## Database Migration

### SQL Migration
```sql
-- Add theme preference column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system' 
CHECK (theme_preference IN ('light', 'dark', 'system'));

-- Add index for theme preference
CREATE INDEX IF NOT EXISTS idx_profiles_theme_preference ON profiles(theme_preference);

-- Update existing profiles to have default theme preference
UPDATE profiles SET theme_preference = 'system' WHERE theme_preference IS NULL;
```

### Applying the Migration

1. **Automatic**: Run `./scripts/apply-theme-migration.sh` for guided instructions
2. **Manual**: Execute the SQL commands in your Supabase dashboard

## Usage

### For Users

1. **Accessing Theme Settings**:
   - Go to Settings page
   - Click on the "Theme" tab
   - Select your preferred theme option

2. **Theme Options**:
   - **System**: Follows your device's theme settings
   - **Light**: Always light theme
   - **Dark**: Always dark theme

### For Developers

#### Using the Theme in Components

```tsx
import { useTheme } from 'next-themes'

function MyComponent() {
  const { theme, setTheme } = useTheme()
  
  return (
    <div className="bg-background text-foreground">
      Current theme: {theme}
    </div>
  )
}
```

#### Styling with Theme-Aware Classes

```tsx
// Use Tailwind's semantic color classes
<div className="bg-background text-foreground border-border">
  Content that adapts to theme
</div>

// Or use mood-specific classes
<div className="mood-excellent">
  Excellent mood indicator
</div>
```

## File Structure

```
├── components/
│   ├── providers/
│   │   └── ThemeProvider.tsx          # Main theme provider
│   └── settings/
│       └── ThemeSelector.tsx          # Theme selection UI
├── app/
│   ├── layout.tsx                     # Updated with ThemeProvider
│   └── globals.css                    # Enhanced with dark mode styles
├── supabase/migrations/
│   └── 010_theme_preferences.sql      # Database migration
├── scripts/
│   └── apply-theme-migration.sh       # Migration helper script
└── tailwind.config.ts                 # Updated with dark mode support
```

## Browser Support

- **Modern Browsers**: Full support for all features
- **System Theme Detection**: Supported in browsers that implement `prefers-color-scheme`
- **Fallback**: Gracefully falls back to light theme in unsupported browsers

## Performance Considerations

- **No Flash**: Prevents theme flash on page load
- **SSR Safe**: Properly handles server-side rendering
- **Optimized**: Minimal JavaScript overhead
- **Cached**: Theme preferences are cached locally

## Accessibility

- **High Contrast**: Dark mode provides better contrast for low-light environments
- **System Respect**: Respects user's system accessibility preferences
- **Color Blind Friendly**: Enhanced color choices work well for color vision deficiencies

## Future Enhancements

Potential future improvements could include:

1. **Custom Color Schemes**: Allow users to create custom color palettes
2. **Scheduled Themes**: Automatic theme switching based on time of day
3. **High Contrast Mode**: Additional accessibility option
4. **Theme Animations**: Smooth transitions between theme changes

## Troubleshooting

### Common Issues

1. **Theme not persisting**: Ensure database migration is applied
2. **Flash on load**: Check that ThemeProvider is properly configured
3. **Colors not updating**: Verify CSS custom properties are used correctly

### Debug Mode

To debug theme issues, check the browser console for theme-related logs and verify that the `theme_preference` column exists in your profiles table.

## Support

For issues or questions about the theme implementation:

1. Check the browser console for error messages
2. Verify database migration was applied successfully
3. Ensure user is properly authenticated for preference saving
4. Test with different browsers and devices
# MoodJournal Troubleshooting

## 🔧 Common Issues

### Login & Authentication Problems

#### Can't Sign In
- **Check Email**: Verify you're using the correct email address
- **Password Reset**: Use "Forgot Password" if you can't remember
- **Email Verification**: Check spam folder for verification email
- **Browser Cache**: Clear cache and cookies, then try again

#### Session Expires Quickly
- **Browser Settings**: Check if cookies are enabled
- **Incognito Mode**: Try regular browser window instead
- **Extensions**: Disable ad blockers that might interfere
- **Multiple Tabs**: Close other MoodJournal tabs

### Voice Recording Issues

#### Microphone Not Working
- **Browser Permission**: Allow microphone access when prompted
- **System Settings**: Check device microphone permissions
- **Hardware Test**: Test microphone in other applications
- **Browser Support**: Use Chrome or Firefox for best compatibility

#### Transcription Fails
- **API Key**: Verify OpenAI API key is configured correctly
- **Internet Connection**: Check network connectivity
- **Audio Quality**: Speak clearly and reduce background noise
- **File Size**: Keep recordings under 10MB

#### Audio Playback Problems
- **Browser Support**: Update to latest browser version
- **Audio Format**: Try different browser if playback fails
- **Storage Access**: Check Supabase storage permissions
- **File Corruption**: Re-record if audio file is damaged

### Weather Integration Issues

#### Weather Not Loading
- **API Key**: Verify OpenWeatherMap API key is valid
- **Location Required**: Add location to journal entry first
- **API Limits**: Check if you've exceeded daily API limit (1,000 calls)
- **Network Issues**: Verify internet connection

#### Incorrect Weather Data
- **Location Accuracy**: Ensure location is specific enough
- **Date Limitations**: Historical weather only available for past 5 days
- **Cache Issues**: Weather data is cached - may need to wait for refresh
- **API Status**: Check OpenWeatherMap service status

### Theme & Display Issues

#### Theme Not Saving
- **Login Required**: Theme preferences require user account
- **Database Connection**: Check if you can save other settings
- **Browser Storage**: Clear local storage and try again
- **Sync Delay**: Allow time for cross-device synchronization

#### Colors Look Wrong
- **Browser Compatibility**: Update to latest browser version
- **CSS Loading**: Hard refresh page (Ctrl+F5 or Cmd+Shift+R)
- **Theme Conflicts**: Try switching themes to reset
- **Display Settings**: Check system display calibration

### Performance Issues

#### App Running Slowly
- **Browser Tabs**: Close unnecessary tabs to free memory
- **Extensions**: Disable browser extensions temporarily
- **Device Storage**: Ensure sufficient storage space available
- **Network Speed**: Check internet connection speed

#### Data Not Syncing
- **Internet Connection**: Verify stable network connection
- **Server Status**: Check if Supabase services are operational
- **Browser Cache**: Clear cache and reload application
- **Account Status**: Ensure account is active and authenticated

## 🛠️ Setup & Configuration

### Environment Variables Not Working

#### Missing API Keys
- **File Location**: Ensure `.env.local` is in project root
- **Variable Names**: Check exact spelling of environment variables
- **Restart Required**: Restart development server after changes
- **Quotes**: Don't use quotes around values in .env files

#### Database Connection Issues
- **Supabase URL**: Verify project URL is correct
- **API Keys**: Check both anon key and service role key
- **Project Status**: Ensure Supabase project is active
- **Network Access**: Check firewall/proxy settings

### Migration Problems

#### Database Tables Missing
- **Migration Order**: Apply migrations in numerical order (001, 002, etc.)
- **SQL Errors**: Check for syntax errors in migration files
- **Permissions**: Ensure you have admin access to database
- **Manual Application**: Use Supabase dashboard SQL editor as backup

#### Storage Bucket Issues
- **Bucket Creation**: Verify `audio-recordings` bucket exists
- **RLS Policies**: Check Row Level Security policies are applied
- **Service Role**: Ensure service role key has storage permissions
- **Manual Setup**: Use SQL commands if automated setup fails

## 📱 Mobile & Browser Issues

### Mobile Compatibility

#### Touch Interface Problems
- **Viewport Settings**: Ensure proper mobile viewport configuration
- **Touch Targets**: Buttons should be large enough for touch
- **Scroll Issues**: Check for CSS overflow problems
- **Orientation**: Test both portrait and landscape modes

#### Mobile Recording Issues
- **Browser Choice**: Use Chrome or Safari on mobile
- **Permissions**: Grant microphone access in browser settings
- **Background Recording**: Some browsers pause recording when switching apps
- **Storage Limits**: Mobile browsers may have storage restrictions

### Browser Compatibility

#### Feature Not Working
- **Browser Support**: Use Chrome, Firefox, Safari, or Edge
- **JavaScript Enabled**: Ensure JavaScript is not disabled
- **Update Browser**: Use latest version for best compatibility
- **Incognito Mode**: Test in private/incognito window

#### Loading Issues
- **Cache Problems**: Clear browser cache and cookies
- **Network Issues**: Check internet connection stability
- **CDN Problems**: Try different network if resources won't load
- **Ad Blockers**: Temporarily disable ad blocking extensions

## 🔍 Debugging Steps

### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for error messages in red
4. Take screenshot of errors for support

### Verify Configuration
1. Check all environment variables are set
2. Test database connection
3. Verify API keys are valid
4. Confirm storage permissions

### Test Individual Features
1. Try each feature separately
2. Note which specific actions fail
3. Test in different browsers
4. Compare with working features

### Network Diagnostics
1. Check internet connection speed
2. Test API endpoints directly
3. Verify firewall/proxy settings
4. Try different network if available

## 🆘 Getting Additional Help

### Self-Service Resources
- **User Guide**: Complete setup and usage instructions
- **Features Documentation**: Detailed feature explanations
- **API Documentation**: Technical integration details
- **Community Forums**: User discussions and solutions

### Reporting Issues
When reporting problems, include:
- **Browser and Version**: What browser you're using
- **Error Messages**: Exact text of any error messages
- **Steps to Reproduce**: What you did before the problem occurred
- **Screenshots**: Visual evidence of the issue
- **Console Logs**: Any errors from browser developer tools

### Quick Fixes Checklist
Before seeking help, try:
- [ ] Refresh the page
- [ ] Clear browser cache
- [ ] Check internet connection
- [ ] Verify login status
- [ ] Test in different browser
- [ ] Check environment variables
- [ ] Restart development server
- [ ] Review recent changes

Most issues can be resolved with these basic troubleshooting steps. If problems persist, the detailed information above should help identify and fix the specific issue you're experiencing.
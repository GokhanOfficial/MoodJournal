#!/bin/bash

# Smart Reminders & Notifications Cron Job
# This script should be run every minute to check for due reminders

# Set the API endpoint
API_ENDPOINT="http://localhost:3000/api/notifications/send"

# Make the API call to process notifications
curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  --silent \
  --show-error \
  --fail \
  --max-time 30

# Check if the request was successful
if [ $? -eq 0 ]; then
  echo "$(date): Notifications processed successfully"
else
  echo "$(date): Error processing notifications" >&2
  exit 1
fi
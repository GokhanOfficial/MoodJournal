'use client'

import { useState } from 'react'
import LocationSelector, { type LocationData } from '@/components/location/LocationSelector'
import { MapPin, Calendar, Clock } from 'lucide-react'

export default function LocationDemo() {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Location Feature Demo</h2>
        <p className="text-muted-foreground">
          Try the location selector below - it works for both current location and manual search
        </p>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Add Location to Journal Entry
        </h3>
        
        <div className="space-y-4">
          <LocationSelector
            value={selectedLocation}
            onChange={setSelectedLocation}
            placeholder="Search for a location or use current location..."
            allowCurrent={true}
          />
          
          {selectedLocation && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Selected Location
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Coordinates:</span>
                    <br />
                    <span className="text-muted-foreground">
                      {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                    </span>
                  </div>
                  
                  {selectedLocation.city && (
                    <div>
                      <span className="font-medium">City:</span>
                      <br />
                      <span className="text-muted-foreground">{selectedLocation.city}</span>
                    </div>
                  )}
                </div>
                
                {selectedLocation.country && (
                  <div>
                    <span className="font-medium">Country:</span>
                    <br />
                    <span className="text-muted-foreground">{selectedLocation.country}</span>
                  </div>
                )}
                
                <div>
                  <span className="font-medium">Full Address:</span>
                  <br />
                  <span className="text-muted-foreground">{selectedLocation.address}</span>
                </div>
                
                {selectedLocation.timezone && (
                  <div>
                    <span className="font-medium">Timezone:</span>
                    <br />
                    <span className="text-muted-foreground">{selectedLocation.timezone}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  💡 This location data would be permanently saved with your journal entry
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          How It Works
        </h3>
        
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
              1
            </div>
            <div>
              <h4 className="font-medium">Current Location</h4>
              <p className="text-muted-foreground">
                Click the navigation icon to use your device's GPS. Requires location permission.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
              2
            </div>
            <div>
              <h4 className="font-medium">Manual Search</h4>
              <p className="text-muted-foreground">
                Click the location field and type any location worldwide. Powered by OpenStreetMap.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
              3
            </div>
            <div>
              <h4 className="font-medium">Permanent Storage</h4>
              <p className="text-muted-foreground">
                Location is saved with your journal entry and can be used for future analytics.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Use Cases
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm">Current Entries</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Add location to today's journal entry to remember where important thoughts happened
            </p>
          </div>
          
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm">Historical Entries</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Add location when writing about past experiences or travels
            </p>
          </div>
          
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm">Travel Journaling</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Perfect for documenting trips and experiences in different places
            </p>
          </div>
          
          <div className="p-3 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm">Mood Patterns</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Discover how different locations affect your mood and wellbeing
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
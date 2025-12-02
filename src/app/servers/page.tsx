'use client'

import { useState, useEffect } from 'react'
import { Card, Title, Text, Grid, ProgressBar, Badge } from '@tremor/react'
import { dashboardApi } from '@/lib/api'

interface Server {
  id: string
  name: string
  location: string
  country: string
  load: number
  currentUsers: number
  maxUsers: number
  isActive: boolean
}

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadServers()
  }, [])

  async function loadServers() {
    try {
      // Mock data for now
      const mockServers: Server[] = [
        {
          id: '1',
          name: 'US East',
          location: 'New York',
          country: 'US',
          load: 67,
          currentUsers: 523,
          maxUsers: 1000,
          isActive: true,
        },
        {
          id: '2',
          name: 'EU West',
          location: 'London',
          country: 'UK',
          load: 45,
          currentUsers: 412,
          maxUsers: 1000,
          isActive: true,
        },
        {
          id: '3',
          name: 'Asia Pacific',
          location: 'Singapore',
          country: 'SG',
          load: 32,
          currentUsers: 299,
          maxUsers: 1000,
          isActive: true,
        },
      ]
      setServers(mockServers)
    } catch (error) {
      console.error('Failed to load servers:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    )
  }

  const getLoadColor = (load: number): "red" | "yellow" | "green" => {
    if (load > 80) return "red"
    if (load > 50) return "yellow"
    return "green"
  }

  return (
    <div className="space-y-6">
      <div>
        <Title>Servers</Title>
        <Text>Monitor and manage VPN servers</Text>
      </div>

      <Grid numItemsLg={2} className="gap-6">
        {servers.map((server) => (
          <Card key={server.id}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <Title>{server.name}</Title>
                <Text>
                  {server.location}, {server.country}
                </Text>
              </div>
              <Badge color={server.isActive ? "green" : "red"}>
                {server.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Text>Server Load</Text>
                  <Text className="font-medium">{server.load}%</Text>
                </div>
                <ProgressBar value={server.load} color={getLoadColor(server.load)} />
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-200">
                <div>
                  <Text className="text-gray-500">Users</Text>
                  <Text className="text-lg font-semibold">
                    {server.currentUsers} / {server.maxUsers}
                  </Text>
                </div>
                <div>
                  <Text className="text-gray-500">Capacity</Text>
                  <Text className="text-lg font-semibold">
                    {Math.round((server.currentUsers / server.maxUsers) * 100)}%
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </Grid>
    </div>
  )
}


'use client'

import { useEffect, useState } from 'react'
import { Card, Grid, Title, Text, AreaChart, BarList } from '@tremor/react'
import StatsCard from '@/components/stats-card'
import { dashboardApi } from '@/lib/api'
import { 
  UsersIcon, 
  ServerIcon, 
  CreditCardIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    serversLoad: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      // Mock data for now
      setStats({
        totalUsers: 1234,
        activeSubscriptions: 987,
        totalRevenue: 45670,
        serversLoad: 67,
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock chart data
  const chartData = [
    { month: 'Jan', Users: 400, Revenue: 2400 },
    { month: 'Feb', Users: 450, Revenue: 2800 },
    { month: 'Mar', Users: 520, Users: 3200 },
    { month: 'Apr', Users: 680, Revenue: 4100 },
    { month: 'May', Users: 890, Revenue: 5300 },
    { month: 'Jun', Users: 1234, Revenue: 7200 },
  ]

  const topServers = [
    { name: 'US East', value: 523, icon: () => <ServerIcon className="h-5 w-5" /> },
    { name: 'EU West', value: 412, icon: () => <ServerIcon className="h-5 w-5" /> },
    { name: 'Asia Pacific', value: 299, icon: () => <ServerIcon className="h-5 w-5" /> },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Title>Dashboard</Title>
        <Text>Overview of Outlivion VPN platform</Text>
      </div>

      {/* Stats Grid */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        <StatsCard
          title="Total Users"
          metric={stats.totalUsers.toLocaleString()}
          delta="+12.3%"
          deltaType="increase"
          icon={<UsersIcon className="h-8 w-8" />}
        />
        <StatsCard
          title="Active Subscriptions"
          metric={stats.activeSubscriptions.toLocaleString()}
          delta="+8.1%"
          deltaType="increase"
          icon={<CheckCircleIcon className="h-8 w-8" />}
        />
        <StatsCard
          title="Total Revenue"
          metric={`$${(stats.totalRevenue / 100).toLocaleString()}`}
          delta="+23.5%"
          deltaType="increase"
          icon={<CreditCardIcon className="h-8 w-8" />}
        />
        <StatsCard
          title="Server Load"
          metric={`${stats.serversLoad}%`}
          delta="Normal"
          deltaType="unchanged"
          icon={<ServerIcon className="h-8 w-8" />}
        />
      </Grid>

      {/* Charts */}
      <Grid numItemsLg={2} className="gap-6">
        <Card>
          <Title>User Growth</Title>
          <AreaChart
            className="mt-4 h-72"
            data={chartData}
            index="month"
            categories={["Users"]}
            colors={["blue"]}
            valueFormatter={(value) => value.toLocaleString()}
          />
        </Card>

        <Card>
          <Title>Top Servers by Users</Title>
          <BarList
            data={topServers}
            className="mt-4"
            valueFormatter={(value) => `${value} users`}
          />
        </Card>
      </Grid>

      {/* Recent Activity */}
      <Card>
        <Title>Recent Activity</Title>
        <div className="mt-4 space-y-3">
          {[
            { type: 'payment', text: 'New payment from user #1234', time: '2 min ago' },
            { type: 'user', text: 'New user registered', time: '15 min ago' },
            { type: 'server', text: 'Server EU-West restarted', time: '1 hour ago' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <Text>{activity.text}</Text>
              <Text className="text-gray-500 text-sm">{activity.time}</Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}


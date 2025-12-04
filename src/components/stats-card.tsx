import { memo } from 'react'
import { Card, Metric, Text, Flex, BadgeDelta } from '@tremor/react'

interface StatsCardProps {
  title: string
  metric: string | number
  delta?: string
  deltaType?: 'increase' | 'decrease' | 'unchanged'
  icon?: React.ReactNode
}

function StatsCard({ 
  title, 
  metric, 
  delta, 
  deltaType = 'unchanged',
  icon 
}: StatsCardProps) {
  return (
    <Card decoration="top" decorationColor="blue" className="dark:bg-gray-800 dark:border-gray-700">
      <Flex justifyContent="between" alignItems="center">
        <div>
          <Text className="dark:text-gray-300">{title}</Text>
          <Metric className="dark:text-white">{metric}</Metric>
        </div>
        {icon && <div className="text-gray-400 dark:text-gray-500">{icon}</div>}
      </Flex>
      {delta && (
        <Flex justifyContent="start" className="mt-4">
          <BadgeDelta deltaType={deltaType}>{delta}</BadgeDelta>
        </Flex>
      )}
    </Card>
  )
}

export default memo(StatsCard)


import { Card, Metric, Text, Flex, BadgeDelta } from '@tremor/react'

interface StatsCardProps {
  title: string
  metric: string | number
  delta?: string
  deltaType?: 'increase' | 'decrease' | 'unchanged'
  icon?: React.ReactNode
}

export default function StatsCard({ 
  title, 
  metric, 
  delta, 
  deltaType = 'unchanged',
  icon 
}: StatsCardProps) {
  return (
    <Card decoration="top" decorationColor="blue">
      <Flex justifyContent="between" alignItems="center">
        <div>
          <Text>{title}</Text>
          <Metric>{metric}</Metric>
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </Flex>
      {delta && (
        <Flex justifyContent="start" className="mt-4">
          <BadgeDelta deltaType={deltaType}>{delta}</BadgeDelta>
        </Flex>
      )}
    </Card>
  )
}


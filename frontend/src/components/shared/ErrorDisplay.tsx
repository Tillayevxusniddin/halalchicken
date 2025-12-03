import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorDisplayProps {
  error: Error | string
  onRetry?: () => void
  retrying?: boolean
  title?: string
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  retrying = false,
  title = 'Something went wrong'
}: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
      </CardContent>
      {onRetry && (
        <CardFooter>
          <Button 
            onClick={onRetry} 
            disabled={retrying}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Try Again'}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

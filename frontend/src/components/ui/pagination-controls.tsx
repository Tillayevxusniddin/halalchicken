import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationControlsProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    hasNext: boolean
    hasPrevious: boolean
}

export function PaginationControls({
    currentPage,
    totalPages,
    onPageChange,
    hasNext,
    hasPrevious,
}: PaginationControlsProps) {
    return (
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!hasPrevious}
            >
                <ChevronLeft className="h-4 w-4" />
                Previous
            </Button>
            <div className="text-sm font-medium">
                Page {currentPage} of {totalPages || 1}
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNext}
            >
                Next
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}

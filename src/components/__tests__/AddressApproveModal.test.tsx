import { useOrderStore } from '@/stores/orderStore'
import { fireEvent, render, screen } from '@testing-library/react'
import { AddressApproveModal } from '../AddressApproveModal'

// Mock the store
jest.mock('@/stores/orderStore')
jest.mock('react-hot-toast')

const mockUseOrderStore = useOrderStore as jest.MockedFunction<typeof useOrderStore>

describe('AddressApproveModal', () => {
    const mockProps = {
        isOpen: true,
        onClose: jest.fn(),
        detectedAddress: {
            address: '123 Main St, New York, NY 10001',
            zipCode: '10001',
            city: 'New York'
        }
    }

    const mockStore = {
        updateFormData: jest.fn()
    }

    beforeEach(() => {
        mockUseOrderStore.mockReturnValue(mockStore)
        jest.clearAllMocks()
    })

    it('renders when open', () => {
        render(<AddressApproveModal {...mockProps} />)
        
        expect(screen.getByText('Apply Detected Address')).toBeInTheDocument()
        expect(screen.getByText('Apply Detected')).toBeInTheDocument()
        expect(screen.getByText('Keep Current')).toBeInTheDocument()
    })

    it('does not render when closed', () => {
        render(<AddressApproveModal {...mockProps} isOpen={false} />)
        
        expect(screen.queryByText('Apply Detected Address')).not.toBeInTheDocument()
    })

    it('displays detected address information', () => {
        render(<AddressApproveModal {...mockProps} />)
        
        expect(screen.getByText('123 Main St, New York, NY 10001')).toBeInTheDocument()
        expect(screen.getByText('New York')).toBeInTheDocument()
        expect(screen.getByText('10001')).toBeInTheDocument()
    })

    it('calls onClose when keep current button is clicked', () => {
        render(<AddressApproveModal {...mockProps} />)
        
        fireEvent.click(screen.getByText('Keep Current'))
        
        expect(mockProps.onClose).toHaveBeenCalled()
    })

    it('calls onClose when close button is clicked', () => {
        render(<AddressApproveModal {...mockProps} />)
        
        fireEvent.click(screen.getByRole('button', { name: /close/i }))
        
        expect(mockProps.onClose).toHaveBeenCalled()
    })

    it('calls updateFormData and onClose when apply detected is clicked', () => {
        render(<AddressApproveModal {...mockProps} />)
        
        fireEvent.click(screen.getByText('Apply Detected'))
        
        expect(mockStore.updateFormData).toHaveBeenCalledWith('address', '123 Main St, New York, NY 10001')
        expect(mockStore.updateFormData).toHaveBeenCalledWith('zipCode', '10001')
        expect(mockStore.updateFormData).toHaveBeenCalledWith('city', 'New York')
        expect(mockProps.onClose).toHaveBeenCalled()
    })

    it('shows description text', () => {
        render(<AddressApproveModal {...mockProps} />)
        
        expect(screen.getByText(/We detected a more accurate address/)).toBeInTheDocument()
    })
})

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import App from '../App';

const memoryStore: Record<string, string> = {};

const mockGetItem = jest.fn(async (key: string) => memoryStore[key] ?? null);
const mockSetItem = jest.fn(async (key: string, value: string) => {
  memoryStore[key] = value;
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: mockGetItem,
    setItem: mockSetItem,
  },
}));

const mockIsAvailableAsync = jest.fn(async () => false);
const mockSetUpdateInterval = jest.fn();
const mockAddListener = jest.fn(() => ({ remove: jest.fn() }));

jest.mock('expo-sensors', () => ({
  Accelerometer: {
    isAvailableAsync: mockIsAvailableAsync,
    setUpdateInterval: mockSetUpdateInterval,
    addListener: mockAddListener,
  },
}));

describe('App', () => {
  beforeEach(() => {
    Object.keys(memoryStore).forEach((key) => {
      delete memoryStore[key];
    });
    jest.clearAllMocks();
    mockIsAvailableAsync.mockResolvedValue(false);
  });

  it('renders core controls and records a tap', async () => {
    render(<App />);

    expect(await screen.findByText('CiggyTap')).toBeTruthy();
    
    // Check button and initial metric
    const tapButtons = screen.getAllByText('Tap');
    expect(tapButtons.length).toBeGreaterThan(0);
    
    fireEvent.press(tapButtons[0]); // Press the button (first "Tap")

    await waitFor(() => {
      expect(screen.getByText('Lifetime moments')).toBeTruthy();
    });

  });
});

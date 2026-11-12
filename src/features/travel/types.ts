export const serviceKinds = ['transport', 'hotel', 'taxi', 'food', 'sightseeing'] as const;
export const arrangementStatuses = ['Pending', 'Confirmed', 'Changed', 'Cancelled'] as const;
export type ServiceKind = (typeof serviceKinds)[number];
export type ArrangementStatus = (typeof arrangementStatuses)[number];
export type ServiceField = {
  key: string;
  label: string;
  type?: 'date' | 'time' | 'email' | 'tel' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
  confirm?: boolean;
};
export const serviceDefinitions: Record<
  ServiceKind,
  { label: string; icon: string; fields: ServiceField[] }
> = {
  transport: {
    label: 'Train / Flight',
    icon: '↗',
    fields: [
      {
        key: 'mode',
        label: 'Travel mode',
        type: 'select',
        options: ['Flight', 'Train'],
        required: true,
      },
      { key: 'carrier', label: 'Airline / train name', required: true },
      { key: 'number', label: 'Flight / train number', confirm: true },
      { key: 'from', label: 'Departure airport / station', required: true },
      { key: 'to', label: 'Arrival airport / station', required: true },
      { key: 'date', label: 'Departure date', type: 'date', confirm: true },
      { key: 'departure', label: 'Departure time', type: 'time', confirm: true },
      { key: 'arrivalDate', label: 'Arrival date', type: 'date', confirm: true },
      { key: 'arrival', label: 'Arrival time', type: 'time', confirm: true },
      { key: 'pnr', label: 'PNR / booking reference', confirm: true },
      { key: 'ticket', label: 'Ticket number' },
    ],
  },
  hotel: {
    label: 'Hotels',
    icon: '⌂',
    fields: [
      { key: 'name', label: 'Hotel name', required: true },
      { key: 'address', label: 'Hotel address', confirm: true },
      { key: 'contact', label: 'Hotel contact number', type: 'tel', confirm: true },
      { key: 'room', label: 'Room type', confirm: true },
      { key: 'checkin', label: 'Check-in date', type: 'date', confirm: true },
      { key: 'checkout', label: 'Check-out date', type: 'date', confirm: true },
      { key: 'confirmation', label: 'Confirmation number', confirm: true },
    ],
  },
  taxi: {
    label: 'Taxi & transfers',
    icon: '→',
    fields: [
      { key: 'pickup', label: 'Pickup location', required: true },
      { key: 'drop', label: 'Drop location', required: true },
      { key: 'date', label: 'Pickup date', type: 'date', confirm: true },
      { key: 'time', label: 'Pickup time', type: 'time', confirm: true },
      { key: 'driver', label: 'Driver name', confirm: true },
      { key: 'phone', label: 'Driver contact number', type: 'tel', confirm: true },
      { key: 'vehicle', label: 'Vehicle type / registration', confirm: true },
    ],
  },
  food: {
    label: 'Meals',
    icon: '◷',
    fields: [
      {
        key: 'meal',
        label: 'Meal',
        type: 'select',
        options: ['Breakfast', 'Lunch', 'Dinner', 'Full board'],
        required: true,
      },
      { key: 'restaurant', label: 'Restaurant / venue', confirm: true },
      { key: 'date', label: 'Meal date', type: 'date', confirm: true },
      { key: 'time', label: 'Meal time', type: 'time', confirm: true },
      { key: 'plan', label: 'Meal plan / dietary arrangements', required: true },
    ],
  },
  sightseeing: {
    label: 'Sightseeing',
    icon: '✦',
    fields: [
      { key: 'name', label: 'Activity / attraction', required: true },
      { key: 'location', label: 'Location', required: true },
      { key: 'date', label: 'Activity date', type: 'date', confirm: true },
      { key: 'time', label: 'Start time', type: 'time', confirm: true },
      { key: 'guide', label: 'Guide name' },
      { key: 'phone', label: 'Guide contact number', type: 'tel' },
      { key: 'ticket', label: 'Entry ticket / reference' },
    ],
  },
};
export type TravelService = {
  id: string;
  bookingId: string;
  kind: ServiceKind;
  status: ArrangementStatus;
  fields: Record<string, string>;
  updatedAt: string;
};
export type ItineraryActivity = {
  id: string;
  day: number;
  time: string;
  title: string;
  location: string;
  notes: string;
  status: ArrangementStatus;
};
export type Coordinator = { name: string; phone: string; email: string };
export type TravelDocument = {
  id: string;
  serviceId: string;
  name: string;
  mime: string;
  size: number;
};
export type TravelNotice = { id: string; message: string; createdAt: string; read: boolean };
export type TravelSnapshot = {
  booking: {
    id: string;
    customer: string;
    customerId?: string;
    tour: string;
    travelDate: string;
    returnDate?: string;
    travelers: number;
    status: string;
    phone?: string;
  };
  revision: number;
  services: TravelService[];
  documents: TravelDocument[];
  itinerary: ItineraryActivity[];
  publishedAt: string | null;
  coordinator: Coordinator;
  notifications: TravelNotice[];
  admin: boolean;
};
export function serviceTitle(service: TravelService) {
  return (
    service.fields.name ||
    service.fields.carrier ||
    (service.fields.pickup
      ? `${service.fields.pickup} → ${service.fields.drop}`
      : service.fields.meal) ||
    serviceDefinitions[service.kind].label
  );
}

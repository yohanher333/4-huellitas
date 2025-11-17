# 4HUELLITAS - AI Coding Instructions

## Project Overview
**4HUELLITAS** is a veterinary appointment management system built with React + Vite and Supabase. The system handles appointment booking, professional scheduling, pet management, and patient history with real-time features and WhatsApp integration.

## Architecture & Key Components

### Tech Stack
- **Frontend**: React 18 + Vite, Tailwind CSS, Radix UI components
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: React Context (`SupabaseAuthContext`)
- **Routing**: React Router DOM with role-based access

### Critical Database Schema
The system revolves around these interconnected tables:
- `appointments` - with `assigned_professional_id` linking to professionals
- `professionals` - staff with availability management
- `work_schedules` + `custom_time_slots` - flexible scheduling system
- `professional_availability` - links professionals to time slots
- `pets`, `profiles`, `services` - standard entities

### Professional Assignment Logic
**Key Pattern**: The system uses a dual-scheduling approach:
1. **work_schedules**: Basic recurring weekly schedules
2. **custom_time_slots** + **custom_slot_availability**: Override system for custom availability

When modifying appointment logic in `src/pages/AppointmentPage.jsx`, always check:
- Available professionals via `professional_availability` table
- Slot capacity based on professional count (1 prof = 1 appointment, 2 profs = 2 appointments)
- 2-hour appointment duration + 30-minute cleanup between slots

## Development Workflows

### Database Setup Pattern
**Always run SQL scripts in this order when setting up new environments:**
1. `database-professionals-enhanced.sql` - Creates/updates professionals table
2. `database-availability-final.sql` - Links professionals to schedules
3. Custom time slot scripts from `/database/` folder

### Component Development Patterns
- **Admin Components**: Located in `src/components/admin/`, always use Supabase RLS policies
- **Error Handling**: Components gracefully handle missing database columns with fallback to basic functionality
- **Toast Notifications**: Use `@/components/ui/use-toast` for all user feedback

### Build System
- **Pre-build**: `tools/generate-llms.js` auto-generates route metadata for SEO
- **Development**: `npm run dev` starts on port 3000 with host binding
- **Visual Editor**: Custom Vite plugins for live component editing

## Critical Integration Points

### Supabase Configuration
- **Client**: `src/lib/customSupabaseClient.js` contains hardcoded connection details
- **Auth Context**: `src/contexts/SupabaseAuthContext.jsx` manages user sessions
- **RLS Policies**: All tables use Row Level Security - respect existing policies

### WhatsApp Integration
- **Pattern**: Direct URL construction for appointment reminders
- **Phone Number**: +57 301 263 5719 (hardcoded in multiple components)
- **Message Templates**: Pre-formatted with appointment details

### Professional Assignment System
**Critical Logic in `AppointmentPage.jsx`:**
```javascript
// Always check professional availability before booking
const findAvailableProfessional = async (date, time) => {
  // 1. Find custom time slot
  // 2. Check professional_availability
  // 3. Verify appointment capacity
  // 4. Auto-assign professional to appointment
}
```

## Project-Specific Conventions

### File Organization
- Admin features: `src/components/admin/` - separate manager components for each entity
- Database scripts: Root level `.sql` files + `/database/` folder for complex setups
- Documentation: Root level `.md` files track implementation status

### Error Recovery Patterns
Components handle missing database columns gracefully:
```javascript
// Standard pattern for professional management
if (error.message.includes('column') && error.message.includes('does not exist')) {
  // Fall back to basic data insertion
  const { error: basicError } = await supabase.from('table').insert(basicData);
}
```

### Real-time Updates
- Dashboard components subscribe to Supabase real-time changes
- Auto-refresh every 30 seconds for appointment lists
- Manual refresh buttons with loading animations

## Development Gotchas
- **SQL Scripts**: Must be run in correct order - check documentation files for sequences
- **Professional Availability**: Always update `professional_availability` when modifying schedules
- **Time Format**: Database stores TIME as HH:MM:SS, frontend often needs conversion
- **Role-based Access**: Admin routes check `role = 'admin'` in profiles table

## Key Files for Context
- `src/pages/AppointmentPage.jsx` - Core booking logic and professional assignment
- `src/components/admin/ProfessionalsManagerNew.jsx` - Professional CRUD with availability
- `database-updates.sql` - Contains professional assignment system setup
- `SISTEMA-PROFESIONALES.md` - Documents professional scheduling architecture
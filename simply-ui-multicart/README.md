# Simply UI Multicart

A modern e-commerce application built with Next.js, featuring multi-cart functionality and a clean UI design.

## Features

- **Multi-cart Management**: Create and manage multiple shopping carts
- **User Authentication**: Secure login and registration system
- **Product Search**: Advanced search with filters
- **Wishlist**: Save products for later
- **Responsive Design**: Works on desktop and mobile devices
- **Enhanced Checkout**: Streamlined checkout process
- **Member Area**: Special features for registered users
- **User Profiles**: Customizable user profiles

## Technologies Used

- **Frontend**:
  - Next.js 14+
  - React
  - TypeScript
  - Tailwind CSS
  - Shadcn UI Components

- **Backend**:
  - Supabase (Authentication, Database)

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/simply-ui-multicart.git
   cd simply-ui-multicart
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
simply-ui-multicart/
├── app/                  # Next.js app directory
│   ├── auth/             # Authentication pages
│   ├── members/          # Member-only pages
│   ├── profile/          # User profile pages
│   ├── wishlist/         # Wishlist pages
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── ui/               # UI components (shadcn/ui)
│   └── ...               # Application-specific components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and libraries
├── public/               # Static assets
├── styles/               # Additional styles
└── supabase/             # Supabase configuration and migrations
```

## Usage

### Shopping Cart

The application allows users to:
- Add products to cart
- Manage multiple carts
- Update quantities
- Remove items
- Proceed to checkout

### Authentication

Users can:
- Register for a new account
- Log in to existing accounts
- Reset passwords
- Manage their profiles

### Wishlist

The wishlist feature allows users to:
- Save products for later
- Move items between wishlist and cart
- Share wishlists

## Development

### Commands

- `pnpm dev`: Start the development server
- `pnpm build`: Build the application for production
- `pnpm start`: Start the production server
- `pnpm lint`: Run ESLint to check code quality

### Database Migrations

The project uses Supabase migrations for database schema changes. To apply migrations:

```bash
npx supabase migration up
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

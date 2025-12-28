src/
├── app/
│ ├── (auth)/ # Auth-related pages
│ │ ├── login/
│ │ ├── register/
│ │ └── verify/ # OTP verification
│ ├── (dashboard)/ # Parent dashboard
│ │ ├── dashboard/
│ │ ├── payments/
│ │ ├── courses/
│ │ └── profile/
│ ├── (admin)/ # Admin pages
│ │ ├── dashboard/
│ │ ├── courses/
│ │ ├── students/
│ │ └── payments/
│ ├── api/ # API routes
│ └── layout.tsx # Root layout
├── components/
│ ├── ui/ # shadcn components
│ ├── auth/ # Auth components
│ ├── dashboard/ # Dashboard components
│ ├── admin/ # Admin components
│ ├── forms/ # Form components
│ └── shared/ # Shared components
├── lib/
│ ├── auth.ts # Auth utilities
│ ├── api.ts # API client
│ ├── sms.ts # SMS utilities
│ └── utils.ts # Utility functions
├── hooks/
│ ├── useAuth.ts # Auth hook
│ └── useToast.ts # Toast notifications hook
├── store/
│ └── authStore.ts # Zustand auth store
└── types/
└── index.ts # TypeScript types

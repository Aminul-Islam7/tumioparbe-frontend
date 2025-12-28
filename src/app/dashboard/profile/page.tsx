'use client';

import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { userApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import {
    User,
    Home,
    Phone,
    Mail,
    Facebook,
    Loader2,
} from 'lucide-react';

// Form validation schema
const ParentProfileSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    phone: Yup.string()
        .matches(/^01[2-9]\d{8}$/, 'Please enter a valid 11-digit phone number')
        .required('Phone number is required'),
    address: Yup.string().required('Address is required'),
    facebook_profile: Yup.string()
        .matches(
            /^(https?:\/\/)?(www\.)?(facebook|fb)\.com\/[a-zA-Z0-9(.?)?]/,
            'Please enter a valid Facebook URL'
        )
        .required('Facebook profile is required'),
    email: Yup.string().email('Invalid email address'),
});

export default function ProfilePage() {
    const { user, updateUser } = useAuth(true);
    const { showSuccess, showError } = useToast();
    const [savingParent, setSavingParent] = useState(false);

    // Handle parent profile update
    const handleUpdateProfile = async (values: any) => {
        try {
            setSavingParent(true);
            const response = await userApi.updateProfile(values);
            if (response.data) {
                updateUser(response.data);
                showSuccess('Success', 'Your profile has been updated.');
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            showError('Error', 'Failed to update profile. Please try again.');
        } finally {
            setSavingParent(false);
        }
    };

    if (!user) {
        return <div className="p-8 text-center">Loading profile data...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Profile Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your personal information
                </p>
            </div>

            <div className="bg-background rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-6">Parent Information</h2>

                <Formik
                    initialValues={{
                        name: user.name || '',
                        phone: user.phone || '',
                        address: user.address || '',
                        facebook_profile: user.facebook_profile || '',
                        email: user.email || '',
                    }}
                    validationSchema={ParentProfileSchema}
                    onSubmit={handleUpdateProfile}
                    enableReinitialize
                >
                    {({ isValid, dirty }) => (
                        <Form className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4" /> Full Name
                                    </label>
                                    <Field
                                        name="name"
                                        type="text"
                                        className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                    />
                                    <ErrorMessage
                                        name="name"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Phone className="h-4 w-4" /> Phone Number
                                    </label>
                                    <Field
                                        name="phone"
                                        type="text"
                                        disabled={true} // Phone number can't be changed
                                        className="flex h-10 w-full rounded-md border bg-muted px-3 py-2 text-sm cursor-not-allowed"
                                    />
                                    <ErrorMessage
                                        name="phone"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                </div>

                                {/* Facebook Profile */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Facebook className="h-4 w-4" /> Facebook Profile
                                    </label>
                                    <Field
                                        name="facebook_profile"
                                        type="text"
                                        className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                    />
                                    <ErrorMessage
                                        name="facebook_profile"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Mail className="h-4 w-4" /> Email (Optional)
                                    </label>
                                    <Field
                                        name="email"
                                        type="email"
                                        className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                    />
                                    <ErrorMessage
                                        name="email"
                                        component="div"
                                        className="text-red-500 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Home className="h-4 w-4" /> Address
                                </label>
                                <Field
                                    name="address"
                                    as="textarea"
                                    rows={3}
                                    className="flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp_red focus-visible:ring-offset-2"
                                />
                                <ErrorMessage
                                    name="address"
                                    component="div"
                                    className="text-red-500 text-xs"
                                />
                            </div>

                            {/* Submit button */}
                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    className="bg-tp_red hover:bg-red-600"
                                    disabled={savingParent || !dirty || !isValid}
                                >
                                    {savingParent ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>Save Changes</>
                                    )}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}

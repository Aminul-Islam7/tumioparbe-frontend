'use client';

import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { userApi, authApi } from '@/lib/api';
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
    Lock,
    Eye,
    EyeOff,
    LogOut,
} from 'lucide-react';

// Form validation schema for profile
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

// Form validation schema for password change
const ChangePasswordSchema = Yup.object().shape({
    currentPassword: Yup.string().required('Current password is required'),
    newPassword: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('New password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Please confirm your new password'),
});

export default function ProfilePage() {
    const router = useRouter();
    const { user, updateUser, logout } = useAuth(true);
    const { showSuccess, showError } = useToast();
    const [savingParent, setSavingParent] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    // Handle parent profile update
    const handleUpdateProfile = async (values: any) => {
        try {
            setSavingParent(true);
            const response = await userApi.updateProfile(values);
            if (response.data.success && response.data.data) {
                updateUser(response.data.data);
                showSuccess('Success', 'Your profile has been updated.');
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            showError('Error', 'Failed to update profile. Please try again.');
        } finally {
            setSavingParent(false);
        }
    };

    // Handle password change
    const handleChangePassword = async (
        values: { currentPassword: string; newPassword: string; confirmPassword: string },
        { resetForm }: { resetForm: () => void }
    ) => {
        try {
            setChangingPassword(true);
            const response = await authApi.changePassword(
                values.currentPassword,
                values.newPassword,
                values.confirmPassword
            );
            if (response.data.success) {
                showSuccess('Success', 'Your password has been changed successfully.');
                resetForm();
            }
        } catch (error: any) {
            console.error('Failed to change password:', error);
            const errorMessage =
                error.response?.data?.errors?.current_password?.[0] ||
                error.response?.data?.errors?.new_password?.[0] ||
                error.response?.data?.message ||
                'Failed to change password. Please try again.';
            showError('Error', errorMessage);
        } finally {
            setChangingPassword(false);
        }
    };

    if (!user) {
        return <div className="p-8 text-center">Loading profile data...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Profile Information and Change Password - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Information Section */}
                <div className="bg-background rounded-lg border p-6">
                    <h2 className="text-xl font-semibold mb-6">Profile Information</h2>

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
                    >
                        {({ errors, touched, dirty, isValid }) => (
                            <Form className="space-y-4">
                                {/* Name Field */}
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        Name
                                    </label>
                                    <Field
                                        id="name"
                                        name="name"
                                        type="text"
                                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                            errors.name && touched.name ? 'border-red-500' : 'border-input'
                                        }`}
                                    />
                                    <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
                                </div>

                                {/* Phone Field */}
                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        Phone Number
                                    </label>
                                    <Field
                                        id="phone"
                                        name="phone"
                                        type="text"
                                        disabled
                                        className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm cursor-not-allowed"
                                    />
                                    <p className="text-xs text-muted-foreground">Phone number cannot be changed</p>
                                </div>

                                {/* Address Field */}
                                <div className="space-y-2">
                                    <label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                                        <Home className="h-4 w-4 text-muted-foreground" />
                                        Address
                                    </label>
                                    <Field
                                        id="address"
                                        name="address"
                                        as="textarea"
                                        rows={3}
                                        className={`flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                            errors.address && touched.address ? 'border-red-500' : 'border-input'
                                        }`}
                                    />
                                    <ErrorMessage name="address" component="div" className="text-red-500 text-sm" />
                                </div>

                                {/* Facebook Profile Field */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="facebook_profile"
                                        className="text-sm font-medium flex items-center gap-2"
                                    >
                                        <Facebook className="h-4 w-4 text-muted-foreground" />
                                        Facebook Profile
                                    </label>
                                    <Field
                                        id="facebook_profile"
                                        name="facebook_profile"
                                        type="text"
                                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                            errors.facebook_profile && touched.facebook_profile
                                                ? 'border-red-500'
                                                : 'border-input'
                                        }`}
                                    />
                                    <ErrorMessage
                                        name="facebook_profile"
                                        component="div"
                                        className="text-red-500 text-sm"
                                    />
                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        Email (Optional)
                                    </label>
                                    <Field
                                        id="email"
                                        name="email"
                                        type="email"
                                        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                            errors.email && touched.email ? 'border-red-500' : 'border-input'
                                        }`}
                                    />
                                    <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        className="w-full bg-tp_red hover:bg-red-600"
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

                {/* Change Password Section */}
                <div className="bg-background rounded-lg border p-6">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        Change Password
                    </h2>

                    <Formik
                        initialValues={{
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                        }}
                        validationSchema={ChangePasswordSchema}
                        onSubmit={handleChangePassword}
                    >
                        {({ errors, touched, dirty, isValid }) => (
                            <Form className="space-y-4">
                                {/* Current Password */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="currentPassword"
                                        className="text-sm font-medium flex items-center gap-2"
                                    >
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <Field
                                            id="currentPassword"
                                            name="currentPassword"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                                errors.currentPassword && touched.currentPassword
                                                    ? 'border-red-500'
                                                    : 'border-input'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showCurrentPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <ErrorMessage
                                        name="currentPassword"
                                        component="div"
                                        className="text-red-500 text-sm"
                                    />
                                </div>

                                {/* New Password */}
                                <div className="space-y-2">
                                    <label htmlFor="newPassword" className="text-sm font-medium flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Field
                                            id="newPassword"
                                            name="newPassword"
                                            type={showNewPassword ? 'text' : 'password'}
                                            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                                errors.newPassword && touched.newPassword
                                                    ? 'border-red-500'
                                                    : 'border-input'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <ErrorMessage name="newPassword" component="div" className="text-red-500 text-sm" />
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <label
                                        htmlFor="confirmPassword"
                                        className="text-sm font-medium flex items-center gap-2"
                                    >
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        Confirm New Password
                                    </label>
                                    <div className="relative">
                                        <Field
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                                errors.confirmPassword && touched.confirmPassword
                                                    ? 'border-red-500'
                                                    : 'border-input'
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <ErrorMessage
                                        name="confirmPassword"
                                        component="div"
                                        className="text-red-500 text-sm"
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <Button
                                        type="submit"
                                        className="w-full bg-tp_red hover:bg-red-600"
                                        disabled={changingPassword || !dirty || !isValid}
                                    >
                                        {changingPassword ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Changing...
                                            </>
                                        ) : (
                                            <>Change Password</>
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>

            {/* Logout Section - Simplified */}
            <div className="flex justify-center">
                <Button
                    onClick={handleLogout}
                    variant="destructive"
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white px-12 py-6 text-lg"
                >
                    <LogOut className="mr-2 h-5 w-5" />
                    Logout from Account
                </Button>
            </div>
        </div>
    );
}

// pages/admin/users/edit/[id].tsx
import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getSession } from 'next-auth/react';
import prisma from '@/lib/db';
import { User as PrismaUser, Role } from '@prisma/client';

// Define the type for user data to be edited
interface UserFormData {
  id: string;
  name: string;
  email: string;
  role: Role;
  // Add other editable fields if any (e.g., address, phone)
}

// Define the type for page props
interface EditUserPageProps {
  user: UserFormData | null;
  error?: string;
  currentUserRole: Role;
  currentUserId: string;
}

// getServerSideProps to fetch user data and check authorization
export const getServerSideProps: GetServerSideProps<EditUserPageProps> = async (context) => {
  const session = await getSession(context);
  const { id } = context.params as { id: string };

  // Check if user is authenticated
  if (!session || !session.user || !session.user.id || !session.user.role) {
    return {
      redirect: {
        destination: '/auth/login?error=unauthorized',
        permanent: false,
      },
    };
  }

  const currentUserId = session.user.id;
  const currentUserRole = session.user.role as Role;

  if (!id || typeof id !== 'string') {
    return {
      props: {
        user: null,
        error: 'Invalid user ID.',
        currentUserRole,
        currentUserId,
      },
    };
  }

  try {
    const userToEdit = await prisma.user.findUnique({
      where: { id: id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!userToEdit) {
      return {
        notFound: true, // Return 404 if user not found
      };
    }

    // Server-side authorization logic
    // 1. Admin cannot edit Super Admin
    if (currentUserRole === Role.ADMIN && userToEdit.role === Role.SUPER_ADMIN) {
      return {
        redirect: {
          destination: '/admin/users?error=unauthorized_edit_superadmin',
          permanent: false,
        },
      };
    }

    // 2. Admin cannot edit other Admins
    if (currentUserRole === Role.ADMIN && userToEdit.role === Role.ADMIN && currentUserId !== userToEdit.id) {
      return {
        redirect: {
          destination: '/admin/users?error=unauthorized_edit_admin',
          permanent: false,
        },
      };
    }

    return {
      props: {
        user: userToEdit,
        currentUserRole,
        currentUserId,
      },
    };
  } catch (error) {
    console.error('Error fetching user for edit:', error);
    return {
      props: {
        user: null,
        error: 'Failed to load user data for editing.',
        currentUserRole,
        currentUserId,
      },
    };
  }
};

const EditUserPage: React.FC<EditUserPageProps> = ({ user, error, currentUserRole, currentUserId }) => {
  const router = useRouter();
  const [formData, setFormData] = useState<UserFormData | null>(user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Function to determine if the role dropdown should be rendered at all
  // This function needs to be defined before it's used in useEffect's dependency array
  const shouldRenderRoleDropdown = () => {
    // Only render if the logged-in user is SUPER_ADMIN
    return currentUserRole === Role.SUPER_ADMIN;
  };

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  // Effect to clear success/error messages after some time
  useEffect(() => {
    if (submitSuccess || submitError) {
      const timer = setTimeout(() => {
        setSubmitSuccess(false);
        setSubmitError(null);
      }, 5000); // Message will disappear after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [submitSuccess, submitError]);

  // --- DEBUGGING LOGS ---
  useEffect(() => {
    console.log('--- EditUserPage Render ---');
    console.log('Current User Role (Logged in):', currentUserRole);
    console.log('User Being Edited Role (formData.role):', formData?.role);
    console.log('shouldRenderRoleDropdown():', shouldRenderRoleDropdown());
    console.log('-------------------------');
  }, [currentUserRole, formData?.role, shouldRenderRoleDropdown]); // shouldRenderRoleDropdown is now defined
  // --- END DEBUGGING LOGS ---


  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <p className="text-xl">Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied or Error</h1>
        <p className="text-lg text-gray-400 mb-8">{error}</p>
        <Link href="/admin/users" className="bg-amber-500 text-gray-900 hover:bg-amber-400 font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
          Back to User Management
        </Link>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold text-red-500 mb-4">User Not Found</h1>
        <p className="text-lg text-gray-400 mb-8">Sorry, the user you are looking for was not found.</p>
        <Link href="/admin/users" className="bg-amber-500 text-gray-900 hover:bg-amber-400 font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105">
          Back to User Management
        </Link>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSubmitError(null); // Clear error on input change
    setSubmitSuccess(false); // Clear success status

    setFormData(prev => (prev ? { ...prev, [name]: value as Role } : null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    // Client-side validation for role change by Admin
    // This check is now redundant for the UI, as the dropdown won't appear for Admins
    // but it's a good fail-safe if somehow the UI is bypassed.
    if (currentUserRole === Role.ADMIN) {
      // If Admin is trying to set role to ADMIN or SUPER_ADMIN
      if (formData?.role === Role.ADMIN || formData?.role === Role.SUPER_ADMIN) {
        setSubmitError('As an Admin, you can only assign the Customer role. Please change the role to Customer.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/admin/users/${formData.id}`, {
        method: 'PUT', // Using PUT method for update
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // Send entire formData
      });

      if (res.ok) {
        setSubmitSuccess(true);
        // Redirect after 2 seconds to allow user to see the success message
        setTimeout(() => router.push('/admin/users'), 2000);
      } else {
        const errorData = await res.json();
        setSubmitError(errorData.message || 'Failed to update user.');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setSubmitError('An error occurred while updating the user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to determine available role options in the dropdown
  // This function is now only relevant for SUPER_ADMIN
  const getAvailableRoles = () => {
    return Object.values(Role); // Super Admin can see and select all roles
  };


  return (
    <>
      <Head>
        <title>MyEcom Admin - Edit User: {formData.name || formData.email}</title>
        <meta name="description" content={`Edit user details for ${formData.name || formData.email}`} />
      </Head>

      <div className="min-h-screen bg-gray-950 text-gray-100 py-12 px-4">
        <div className="container mx-auto bg-gray-900 rounded-xl shadow-2xl p-8 lg:p-12">
          <h1 className="text-4xl font-bold mb-8 text-center text-amber-300">Edit User</h1>

          {submitError && (
            <div className="bg-red-800 text-white p-4 rounded-lg mb-6 text-center">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="bg-green-600 text-white p-4 rounded-lg mb-6 text-center">
              Changes saved successfully!
            </div>
          )}
          {error && (
            <div className="bg-red-800 text-white p-4 rounded-lg mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            {/* Conditional rendering for Role dropdown */}
            {shouldRenderRoleDropdown() ? (
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  // Dropdown is always enabled for SUPER_ADMIN
                >
                  {getAvailableRoles().map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              // Display current role as plain text if ADMIN is logged in
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <p className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 cursor-not-allowed">
                  {formData.role}
                </p>
                {/* Message for ADMIN when role dropdown is not shown */}
                {currentUserRole === Role.ADMIN && (
                  <p className="text-sm text-red-400 mt-2">
                    As an Admin, you cannot change user roles.
                  </p>
                )}
              </div>
            )}

            {/* Add other editable fields here */}

            <div className="flex justify-end space-x-4 mt-8">
              <button
                type="button"
                onClick={() => router.push('/admin/users')}
                className="px-6 py-3 rounded-lg bg-gray-700 text-gray-200 font-bold hover:bg-gray-600 transition duration-300 ease-in-out"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditUserPage;

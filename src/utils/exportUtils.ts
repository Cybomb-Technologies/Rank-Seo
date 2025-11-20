import { User } from "../app/admin/dashboard/types";

export const exportUsersToCSV = (users: User[], filename: string = 'users-export') => {
  const headers = [
    'Name',
    'Email', 
    'Phone',
    'Plan',
    'Status',
    'Last Login',
    'Created At',
    'Login Method',
    'User ID'
  ];
  
  const csvData = users.map(user => [
    `"${user.name || 'N/A'}"`,
    `"${user.email || 'N/A'}"`,
    `"${user.phone || 'N/A'}"`,
    `"${user.plan || 'Free'}"`,
    `"${user.isVerified ? 'Verified' : 'Pending'}"`,
    `"${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}"`,
    `"${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}"`,
    `"${user.loginMethod || 'Email'}"`,
    `"${user._id || 'N/A'}"`
  ]);

  const csvContent = [headers, ...csvData]
    .map(row => row.join(','))
    .join('\n');

  downloadFile(csvContent, `${filename}-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
};

export const exportUsersToJSON = (users: User[], filename: string = 'users-export') => {
  const jsonContent = JSON.stringify(users, null, 2);
  downloadFile(jsonContent, `${filename}-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
import React from 'react'
import { adminRoot } from "@_/configs";
import { Button } from "@_/components";

export const innerMenu = [
    { key: 'user', label: <Button href={`${adminRoot}/administration/users`} color="blue">Users</Button>, modulePermissions:'100' },
    { key: 'roles_management', label: <Button href={`${adminRoot}/administration/users/permissions`} color="blue">User Permissions</Button>, modulePermissions: '100', rolePermissions: "100.11" },
    { key: 'permissions', label: <Button href={`${adminRoot}/administration/users/permissions/user_types`} color="blue">User Types</Button>, modulePermissions: '100', rolePermissions: "100.10" },
]


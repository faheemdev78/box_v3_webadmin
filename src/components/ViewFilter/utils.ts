import { ViewConfig, ViewVisibility } from './types';

/**
 * Check if user can edit a view
 */
export function canEditView(view: ViewConfig, userId: string, userRole: string): boolean {
    // Super admin can edit any view
    if (userRole === 'super_admin') {
        return true;
    }

    // Creator can edit their own view
    if (view.createdBy === userId) {
        return true;
    }

    return false;
}

/**
 * Check if user can delete a view
 */
export function canDeleteView(view: ViewConfig, userId: string, userRole: string): boolean {
    // Super admin can delete any view
    if (userRole === 'super_admin') {
        return true;
    }

    // Creator can delete their own view
    if (view.createdBy === userId) {
        return true;
    }

    return false;
}

/**
 * Check if user can see a view based on visibility
 */
export function canSeeView(view: ViewConfig, userId: string, teamId?: string): boolean {
    if (view.isHidden) {
        return false;
    }

    switch (view.visibility) {
        case 'private':
            return view.createdBy === userId;
        case 'team':
            return view.createdBy === userId || (!!teamId && view.createdBy.includes(teamId));
        case 'everyone':
            return true;
        default:
            return false;
    }
}

/**
 * Get visible views for a user
 */
export function getVisibleViews(views: ViewConfig[], userId: string, teamId?: string): ViewConfig[] {
    return views
        .filter(view => canSeeView(view, userId, teamId))
        .sort((a, b) => a.order - b.order);
}

/**
 * Get default view (first non-hidden, or first favorite, or first in list)
 */
export function getDefaultView(views: ViewConfig[], userId: string, teamId?: string): ViewConfig | null {
    const visibleViews = getVisibleViews(views, userId, teamId);

    // Find view marked as default
    const defaultView = visibleViews.find(v => v.isDefault);
    if (defaultView) {
        return defaultView;
    }

    // Find first pinned view
    const pinnedView = visibleViews.find(v => v.isPinned);
    if (pinnedView) {
        return pinnedView;
    }

    // Return first visible view
    return visibleViews[0] || null;
}

/**
 * Clone a view for the current user
 */
export function cloneView(view: ViewConfig, userId: string, newName?: string): ViewConfig {
    return {
        ...view,
        id: 'view_' + Date.now(),
        name: newName || `${view.name} (Copy)`,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: undefined,
        visibility: 'private', // Cloned views default to private
        isDefault: false, // Cloned views are not default
        order: 9999, // Put at the end
    };
}

/**
 * Reorder views
 */
export function reorderViews(views: ViewConfig[], fromIndex: number, toIndex: number): ViewConfig[] {
    const result = Array.from(views);
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);

    // Update order numbers
    return result.map((view, index) => ({
        ...view,
        order: index
    }));
}

/**
 * Get visibility label
 */
export function getVisibilityLabel(visibility: ViewVisibility): string {
    const labels: Record<ViewVisibility, string> = {
        private: 'Private',
        team: 'My Team',
        everyone: 'Everyone'
    };
    return labels[visibility];
}

/**
 * Get visibility icon
 */
export function getVisibilityIcon(visibility: ViewVisibility): string {
    const icons: Record<ViewVisibility, string> = {
        private: 'lock',
        team: 'team',
        everyone: 'global'
    };
    return icons[visibility];
}

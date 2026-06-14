'use client'

import { deleteSiteAction } from '@/app/actions/sites'

// A small "Delete" button that confirms before permanently removing a site.
export function DeleteSiteButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteSiteAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete "${name}"?\n\nThis permanently removes the site and all its messages, and takes it offline. This cannot be undone.`
          )
        ) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
      >
        Delete
      </button>
    </form>
  )
}

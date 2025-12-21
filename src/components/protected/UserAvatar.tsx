/**
 * User Avatar Component
 * 
 * Displays user avatar with first letter of name fallback.
 * Supports future avatar image upload functionality.
 */

import Image from 'next/image'

interface UserAvatarProps {
  name: string
  email?: string
  imageUrl?: string
}

export function UserAvatar({ name, email, imageUrl }: UserAvatarProps) {
  // Get first letter of name, fallback to first letter of email, fallback to 'U'
  const getInitial = (): string => {
    if (name && name.length > 0) {
      return name.charAt(0).toUpperCase()
    }
    if (email && email.length > 0) {
      return email.charAt(0).toUpperCase()
    }
    return 'U'
  }
  
  const initial = getInitial()
  
  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name || email || 'User'}
          width={32}
          height={32}
          className="rounded-full object-cover"
        />
      ) : (
        <span className="text-sm">{initial}</span>
      )}
    </div>
  )
}


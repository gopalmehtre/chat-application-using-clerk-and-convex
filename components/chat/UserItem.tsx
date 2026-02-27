interface UserItemProps {
  user: any;
  onClick: () => void;
}

export default function UserItem({ user, onClick }: UserItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition text-left"
    >
      <div className="relative flex-shrink-0">
        <img
          src={
            user.imageUrl ??
            `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
          }
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        {user.isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>
    </button>
  );
}
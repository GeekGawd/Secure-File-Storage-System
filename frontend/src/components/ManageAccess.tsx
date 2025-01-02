import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useUserAutocompleteQuery,
  useFileUserPermissionListQuery,
  useFileUserPermissionCreateUpdateMutation,
  useFileUserPermissionDeleteMutation,
  PermissionType,
  useCreateShareLinkMutation,
  useUpdateGlobalPermissionMutation,
} from "@/api/routes/files";
import toast from "react-hot-toast";
import { getFileGlobalPermissionType } from "@/store/files/fileSlice";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { BASE_URL } from "@/api";
import { setGlobalPermissionType } from "@/store/files/fileSlice";
interface ManageAccessProps {
  onClose: () => void;
  fileId: string;
}

export const ManageAccess = ({ onClose, fileId }: ManageAccessProps) => {
  // --------------------- Manage Access (Permissions) ---------------------
  const [email, setEmail] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [debouncedEmail, setDebouncedEmail] = useState(email);
  const dispatch = useDispatch();

  // The global permission used for the 'Everyone' role
  const globalPermissionType = useSelector((state: RootState) =>
    getFileGlobalPermissionType(state, fileId)
  );

  // The array that drives the UI
  const [sharedUsers, setSharedUsers] = useState<
    { email: string; permission: PermissionType; user: string }[]
  >([]);

  // Keep track of original user IDs so we know who was truly in userPermissionsList
  const [originalUserIds, setOriginalUserIds] = useState<string[]>([]);

  // Maintain a list of user IDs that should be deleted on Done
  const [removedUserIds, setRemovedUserIds] = useState<string[]>([]);

  // Fetch user suggestions (autocomplete)
  const { data: userSuggestions } = useUserAutocompleteQuery(debouncedEmail, {
    skip: debouncedEmail.length === 0,
  });

  // Fetch user permissions for the file
  const {
    data: userPermissionsList,
    refetch: refetchPermissions,
  } = useFileUserPermissionListQuery(fileId, {
    skip: fileId.length === 0,
  });

  // Add the mutation hooks
  const [updatePermissions] = useFileUserPermissionCreateUpdateMutation();
  const [deletePermissions] = useFileUserPermissionDeleteMutation();
  const [createShareLink] = useCreateShareLinkMutation();
  const [updateGlobalPermission] = useUpdateGlobalPermissionMutation();
  // --------------------------------- Effects ----------------------------------

  // On each render, update the suggestions list
  useEffect(() => {
    setSuggestions(userSuggestions?.data?.map((user) => user.email) || []);
  }, [userSuggestions]);

  // Debounce email input before calling autocomplete
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedEmail(email);
    }, 500);
    return () => clearTimeout(handler);
  }, [email]);

  // Populate sharedUsers and store original user IDs
  useEffect(() => {
    if (userPermissionsList?.data) {
      // Convert the userPermissionsList to our local shape
      const usersFromServer = userPermissionsList.data.map((permissionList) => ({
        user: permissionList.user,
        email: permissionList.email,
        permission: permissionList.permission_type as PermissionType,
      }));

      setOriginalUserIds(usersFromServer.map((u) => u.user));

      // If there are no users from the server and we have a global permission, show Everyone
      if (usersFromServer.length === 0 && globalPermissionType) {
        setSharedUsers([
          {
            user: "everyone",
            email: "Everyone",
            permission: globalPermissionType,
          },
        ]);
      } else {
        setSharedUsers(usersFromServer);
      }
    }
  }, [userPermissionsList, globalPermissionType]);

  // --------------------------------- Handlers ----------------------------------

  const handleSelectSuggestion = (selectedEmail: string, selectedUser: string) => {
    // Only add if not already in the list
    if (!sharedUsers.some((u) => u.email === selectedEmail)) {
      setSharedUsers((prev) => {
        // Remove Everyone if it's in the list
        const filtered = prev.filter((user) => user.email !== "Everyone");
        return [
          ...filtered,
          { email: selectedEmail, permission: "read", user: selectedUser },
        ];
      });
    }
    // Reset input
    setEmail("");
    setSuggestions([]);
  };

  // Change permission for an existing user
  const handleUserPermissionChange = (
    index: number,
    newPermission: PermissionType
  ) => {
    setSharedUsers((prev) => {
      const updated = [...prev];
      updated[index].permission = newPermission;
      return updated;
    });
  };

  // Remove a user **from the UI** only; don't immediately call the API.
  const handleRemoveUserUI = (emailToRemove: string) => {
    setSharedUsers((prev) => {
      const newList = prev.filter((user) => user.email !== emailToRemove);

      // If the user to remove is part of the original list, track it in removedUserIds
      const userInList = prev.find((u) => u.email === emailToRemove);
      if (userInList && originalUserIds.includes(userInList.user)) {
        setRemovedUserIds((prevRemoved) => [...prevRemoved, userInList.user]);
      }

      // If newList becomes empty, re-add Everyone
      if (newList.length === 0 && globalPermissionType) {
        newList.push({
          user: "everyone",
          email: "Everyone",
          permission: globalPermissionType,
        });
      }
      return newList;
    });
  };

  // Commit changes to the server on Done
  const handleDone = async () => {
    try {
      // 1) Delete any users that were in the original list but are now removed
      for (const userId of removedUserIds) {
        try {
          const response = await deletePermissions({ file: fileId, user: userId }).unwrap();
          if (response.status === false) {
            toast.error("Error removing user");
          }
        } catch (error) {
          toast.error("Error removing user");
        }
      }

      // 2) Create or update the permissions for all real users (exclude "Everyone")
      const permissionsData = sharedUsers
        .filter((user) => user.email !== "Everyone") // Exclude "Everyone"
        .map((user) => ({
          file: fileId,
          user: user.user,
          permission_type: user.permission,
        }));

      if (permissionsData.length > 0) {
        await updatePermissions(permissionsData).unwrap();
      }

      // 3) Update global permission for "Everyone" if present
      const everyoneUser = sharedUsers.find((user) => user.email === "Everyone");
      if (everyoneUser) {
        await updateGlobalPermission({
          external_id: fileId,
          global_permission_type: everyoneUser.permission,
        }).unwrap();
        // Dispatch the global permission type to the store
        dispatch(setGlobalPermissionType({ fileId, globalPermissionType: everyoneUser.permission }));
      }

      // Refetch the permissions list after updating and close
      await refetchPermissions();
      onClose();
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error("Error updating permissions");
    }
  };

  // ----------------------- Share Link (Optional) -----------------------
  const [isViewCountLimited, setIsViewCountLimited] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [viewCount, setViewCount] = useState<number>(0);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.checked) {
      setViewCount(0);
    }
    setIsViewCountLimited(e.target.checked);
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const now = new Date();
    if (selectedDate < now) {
      // If selected date is in the past, set to current date/time
      setExpiryDate(getMinDateTime());
    } else {
      setExpiryDate(e.target.value);
    }
  };

  const handleViewCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setViewCount(value >= 0 ? value : 0);
  };

  const handleShare = async () => {
    try {
      const expiresAtISO8601format = expiryDate
        ? new Date(expiryDate).toISOString()
        : undefined;

      const response = await createShareLink({
        file: fileId,
        view_count_limit: viewCount,
        expires_at: expiresAtISO8601format,
      }).unwrap();

      if (response.status === false) {
        toast.error("Error creating share link");
        return;
      }

      const shareLinkUrl = BASE_URL + "/files/share/" + response.data.external_id;
      // Copy to clipboard
      await navigator.clipboard.writeText(shareLinkUrl);
      toast.success("Share link created and copied to clipboard!");
      onClose();
    } catch (error) {
      toast.error("Error creating share link");
    }
  };

  // --------------------------------- UI ----------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Manage Access & Share</h2>

        {/* ------------------- Manage Access Section ------------------- */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Add Specific Users</h3>
          <div className="relative">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter user to share file with only"
            />
            {suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 bg-white border rounded shadow z-10 mt-1">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion}
                    onClick={() =>
                      handleSelectSuggestion(
                        suggestion,
                        userSuggestions?.data?.find((u) => u.email === suggestion)
                          ?.external_id || ""
                      )
                    }
                    className="cursor-pointer hover:bg-gray-200 px-2 py-1"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="shared-users mt-4">
            <h4 className="text-md font-semibold mb-2">Shared Users</h4>
            {sharedUsers.length > 0 ? (
              <ul className="space-y-2">
                {sharedUsers.map((user, index) => (
                  <li
                    key={user.email}
                    className="flex justify-between items-center p-2 border rounded"
                  >
                    <div className="mr-2">
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <select
                      value={user.permission}
                      onChange={(e) =>
                        handleUserPermissionChange(index, e.target.value as PermissionType)
                      }
                      className="border border-gray-300 rounded-md p-1 mr-2"
                    >
                      <option value="read">View</option>
                      <option value="download">Download</option>
                      <option value="all">All</option>
                    </select>
                    <Button
                      variant="ghost"
                      onClick={() => handleRemoveUserUI(user.email)}
                      disabled={user.email === "Everyone"}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">
                No fine-grain control over file access yet.
              </p>
            )}
          </div>
        </div>

        {/* ------------------- Share Link Section ------------------- */}
        <div className="mb-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Share Link Options</h3>

          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="viewCountLimit"
              checked={isViewCountLimited}
              onChange={handleCheckboxChange}
              className="h-4 w-4 border-gray-300 rounded"
            />
            <label
              htmlFor="viewCountLimit"
              className="ml-2 block text-sm text-gray-700"
            >
              Set view count limit
            </label>
          </div>

          {isViewCountLimited && (
            <div className="mb-4">
              <label
                htmlFor="viewCount"
                className="block text-sm font-medium text-gray-700"
              >
                Number of Views Allowed
              </label>
              <input
                type="number"
                id="viewCount"
                value={viewCount}
                onChange={handleViewCountChange}
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="expiryDate"
              className="block text-sm font-medium text-gray-700"
            >
              Expiry Date & Time
            </label>
            <input
              type="datetime-local"
              id="expiryDate"
              value={expiryDate}
              onChange={handleExpiryChange}
              min={getMinDateTime()}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
        </div>

        {/* ---------------------- Footer Buttons ---------------------- */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleShare}>
            Share Link
          </Button>
          <Button onClick={handleDone}>Done</Button>
        </div>
      </div>
    </div>
  );
};
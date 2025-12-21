# Common UI Translations - English (US)

## General UI
loading = Loading...
error = Error
cancel = Cancel
confirm = Confirm
close = Close
open = Open
ok = OK
yes = Yes
no = No
continue = Continue
back = Back
next = Next
finish = Finish

## Actions
save = Save
delete = Delete
edit = Edit
create = Create
update = Update
refresh = Refresh

## Status Messages
success = Success
warning = Warning
info = Information

## Input Placeholders
search-placeholder = Search...
message-input = Enter your message...

## Authentication & Access
please-log-in-to-access-this-page = Please log in to access this page
go-to-settings = Go to Settings
go-back = Go Back

## Demo and Testing
welcome-user = Welcome, { $username }!
notification-count = { $count ->
    [0] No notifications
    [1] One notification
   *[other] { $count } notifications
}

## Offline User
user-offline = user is offline
user-offline-message = { $source ->
    [streamer] @{ $handle } is <1>offline</1>, but they recommend checking out:
   *[default] @{ $handle } is <1>offline</1>, but we recommend checking out:
}
streaming-title = streaming { $title }
viewer-count = { $count ->
    [0] 0 viewers
    [1] 1 viewer
   *[other] { $count } viewers
}

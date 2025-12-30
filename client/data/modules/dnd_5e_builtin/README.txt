All files in this folder (except for this README) are part of the builtin dnd_5e_builtin module

To make changes to this module, copy the folder and rename it to something else but dnd_5e_builtin!
Otherwise all changes will be overwritten on the next program start!

Using the _builtin postfix on custom modules is possible, but i highly advise against it as module IDs might change in a future release and 
as such may overwrite your custom modules if the filenames happen to conflict!

Feel free to use this module as a base for your own module creations

Mandatory files are:
- moduleInfo.json
- shared.css
- *.json, *.css, *.csv for all sheets defined in moduleInfo.json (Make sure filenames match!)

If you plan to update your module, have a look at how module migration data is defined in the dnd_5e_builtin module!

This section will go over all of the fields in the moduleInfo.json:
- name: 
displayname for your module
- version: 
the current version of your module. 
Changing this signals the character manager that old character data needs to be migrated to a new format!
- author: 
author of the module, displayed in the settings module section
- repo: 
a link to the github repo of this module, or wherever the module is hosted
- sheets: 
a list of all pages available in this module. 
If these ever change, make sure to put the old name into the sheetMigration!
- sheetMigration: 
a history of old sheet names. 
If a key in this list matches a past version of your module, existing character data stored for the old sheet will be moved over to the current sheet name.
You can skip versions, but sheets are matched based on order, so sheet 1 will match to the first entry of a sheetMigration of a specific version
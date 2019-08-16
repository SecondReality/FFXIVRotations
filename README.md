# FFXIV Rotations

## Requested Features

A counter that warns you if you reach the max sequence length.

## Running Grunt

In a terminal run `grunt` from the client folder.

To watch: `grunt watch`

Note that `grunt watch` doesn't do all the build steps that the plan `grunt` does (it's suited for development)



## Tools Required

* DB Browser for SQLite https://github.com/sqlitebrowser/sqlitebrowser/releases
* Node
* Grunt

## Grunt Notes

Install grunt with: `npm install -g grunt-cli`

You may need to do this on Windows: Run the following as admin: `npm install --global --production windows-build-tools`

and then: `npm install node-gyp`  (see https://catalin.me/how-to-fix-node-js-gyp-err-cant-find-python-executable-python-on-windows/ for more details)

Install dependencies - move to client folder and run `npm install`

## Information Sources

### Shadowbringers
https://na.finalfantasyxiv.com/jobguide/battle/
http://convertjson.com/html-table-to-json.htm was used to get the data in json format before importing to the database.

A new column was added for shadowbringers: text_cost.
text_cost is a string that contains the cost, the previous cost column was an int that didn't contain the type of unit.
All disciples of war/magic will use text_cost from now on.

JSON to database conversion:

 {
   "Action Name": "Fast Blade",
   "Acquired": "Lv. 1",
   "Type": "Weaponskill",
   "Cast": "Instant",
   "Recast": "2.5s",
   "Cost": "-",
   "RangeRadius": "3y\n \t\t\t0y",
   "Effect": "Delivers an attack with a potency of 200.  \t\t \t\t \t\t\t \t\t\t\t \t\t\t\t\tRevisions \t\t\t\t\t \t\t\t\t\t\t \t\t\t\t\t\t\tPotency has been increased from 160 to 200."
 },

                    id
                    classjob_id*
"Action Name"       name
                    icon
"Type"             action_category (category)       "Spell" -> 2,  "Weaponskill" -> 3
                    help_html
"Acquired"          level                           "Lv. 1" -> 1
                    cost
"RangeRadius"[0]    cast_range                      "3y" -> 3
"Cast"              cast_time                       "Instant" -> 0, "2.5s" -> 2.5
"Recast"            recast_time                     "Instant" -> 0, "2.5s" -> 2.5
"RangeRadius"[1]    effect_range (radius)           "0y" -> 0
                    deprecated

## Database structure


### Columns

The name in the parenthesis is the name that is used in json. Asterisks indicate that the column is not exported to JSON.

id
classjob_id*
name
icon
action_category (category)
help_html
level
cost
cast_range
cast_time
recast_time
effect_range (radius)
deprecated

### Values

action_category:
    2: 'MP'     Spell
    3: 'TP'     Weaponskill  note: TP no longer exists.
    4:  -       Ability
    6: 'GP'
    7: 'CP'

(only 2, 3, 4 can have a radius)
4 doesn't have a cost

### Special ranges

id:

* 11000 -> 12000  special actions like potions
* 8000 -> 8010 ninjutsu

classjob_id:

* 101 = specialist skills for DOH
* 100 = common skills for DOH
* 102 = common skills for DOH that have different icons depending on the class
* 8 -> 15 = cross class crafting skills

* -1 = summoner summon skills
* -2 = iaijutsu skills


## Data Sources

* https://na.finalfantasyxiv.com/jobguide/battle/
* http://www.garlandtools.org/db/#action/50020
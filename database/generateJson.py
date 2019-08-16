# -*- coding: utf-8 -*-
# Extracts data from a sqlite database, and generates a JSON file and a .js file
# Also grabs icons
# All data is saved to the same folder the script is in.

import json
import os
import sqlite3
import urllib
import sys
from urllib.request import urlopen

# Each of the following numbers are the cross-class skills (id  field)
# Note that the classjob_id doesn't always match because classjobs in some cases share cross class skills (e.g. Arm's Length is used by tank and melee)
roleTank = [10, 18, 3622, 3626, 12126, 12127, 12128, 12133] 			# classjob_id 2000
roleHealer = [128, 126, 150, 12130, 143, 12132]							# classjob_id 2001
roleMelee = [57, 34, 76, 82, 12133, 12136]								# classjob_id 2002
roleRanged = [2877, 57, 2884, 12137, 2886, 12133]						# classjob_id 2003
roleMagic = [12142, 150, 12130, 143]									# classjob_id 2004

# Class name, [classjob_id, classjob_id], [cross class skills], discipline
classSets = [
('Paladin', [1, 19], roleTank, 'war'),
('Monk', [2, 20], roleMelee, 'war'),
('Warrior', [3, 21], roleTank, 'war'),
('Dragoon', [4, 22], roleMelee, 'war'),
('Bard', [5, 23], roleRanged, 'war'),
('White Mage', [6, 24], roleHealer, 'magic'),
('Black Mage', [7, 25], roleMagic, 'magic'),

('Carpenter', [8], [], 'hand'),
('Blacksmith', [9], [], 'hand'),
('Armorer', [10], [], 'hand'),
('Goldsmith', [11], [], 'hand'),
('Leatherworker', [12], [], 'hand'),
('Weaver', [13], [], 'hand'),
('Alchemist', [14], [], 'hand'),
('Culinarian', [15], [], 'hand'),

('Miner', [16], [], 'land'),
('Botanist', [17], [], 'land'),
('Fisher', [18], [], 'land'),

('Summoner', [26, 27], roleMagic, 'magic'),
('Scholar', [26, 28], roleHealer, 'magic'),
('Ninja', [29, 30], roleMelee, 'war'),
('Machinist', [31], roleRanged, 'war'),
('Dark Knight', [32], roleTank, 'war'),
('Astrologian', [33], roleHealer, 'magic'),

('Samurai', [34], roleMelee, 'war'),
('Red Mage', [35], roleMagic, 'magic'),

('Gunbreaker', [36], roleTank, 'war'),
('Dancer', [37], roleRanged, 'war'),

]

# If there's no icon file in the data, use the id as the filename
def iconString(id, icon):
	if(icon==None or icon==''):
		return str(id)+".png"
	return icon

def safePrint(str):
	print(str.encode(sys.stdout.encoding, errors='replace'))

skills = {}
classes = {}

conn = sqlite3.connect('skills.db')
conn.row_factory = sqlite3.Row # Enable row objects
c = conn.cursor()
for row in c.execute("SELECT * from skills"):
	actionResult = {
		'name':row['name'],
		'icon': os.path.splitext( os.path.basename( iconString(row['id'], row['icon']) ))[0],
		'level':row['level'],
		'help_html':row['help_html'],
		'cast_time':row['cast_time'],
		'recast_time':row['recast_time'],
		'cast_range':row['cast_range'],
		'cost':row['cost'],
		'category':row['action_category'],
		'radius':row['effect_range'],
		'deprecated':row['deprecated']
	}

	# If it's a crafter the icons are special because it's the same description,
	# but different icons depending on the crafter.
	# In the javascript the class id - 8 will be appended with .png
	# Only disciples of hand have class ids.
	# The id corresponds to the first number classSet[1][0]
	if row['classjob_id']==102:
		actionResult['multiIcon'] = True

	skills[row['id']] = actionResult

def saveImage(url, fileName):
	if not os.path.isfile(fileName):
		urllib.request.urlretrieve(url, fileName)

def query(text, params=()):
	filtered = []
	for row in c.execute(text, params):
		filtered.append(row)
	return filtered

misc = []
# Things in this id range are special actions like potions
for row in query("SELECT * from skills where id >= 11000 and id <= 12000"):
	misc.append(row['id'])

for classSet in classSets:
	allSkills = {}
	thisClass = []
	crossSkills = []

	# add the classes normal skills:
	for row in query("SELECT * from skills where classjob_id=? or classjob_id=?", (classSet[1][0], classSet[1][-1])):
		thisClass.append(row['id'])


	ninjutsuSkills = []
	if classSet[0]=='Ninja':
		for row in query("SELECT * from skills where classjob_id=-4"):
			ninjutsuSkills.append(row['id'])
		allSkills['ninjutsu']=ninjutsuSkills

	stepSkills = []
	if classSet[0]=='Dancer':
		for row in query("SELECT * from skills where classjob_id=-5"):
			stepSkills.append(row['id'])
		allSkills['step']=stepSkills

	specialistSkills = []
	iconSkills = []
	if classSet[3]=='hand':
		# Crafters all receive specialist skills:
		for row in query("SELECT * from skills where classjob_id=101"):
			specialistSkills.append(row['id'])

		# Crafters all receive common skills:
		for row in query("SELECT * from skills where classjob_id=100"):
			thisClass.append(row['id'])

		# Crafters have special skills that are common across crafters but differ only by icon:
		for row in query("SELECT * from skills where classjob_id=102"):
			thisClass.append(row['id'])

		# Build cross class skills
		for row in query("SELECT * from skills where classjob_id >= 8 and classjob_id <= 15 and classjob_id!=?", (str(classSet[1][0]),)):
			crossSkills.append(row['id'])

		# Needed for crafters so their icons can be resolved:
		allSkills['id']=classSet[1][0]

	# Summoner and scholar also receives summon skills:
	summonSkills = []
	if classSet[1][-1]==27 or classSet[1][-1]==28:
		summon_skills_classjob_id = -1
		if classSet[1][-1]==28:
			summon_skills_classjob_id = -3
		for row in query("SELECT * from skills where classjob_id="+str(summon_skills_classjob_id)):
			summonSkills.append(row['id'])

	iaijutsuSkills = []
	if classSet[1][-1]==34:
		for row in query("SELECT * from skills where classjob_id=-2"):
			iaijutsuSkills.append(row['id'])

	if(classSet[3]!='hand' and classSet[3]!='land'):
		crossSkills = classSet[2]
		#for row in query("SELECT * from skills where classjob_id=?", (classSet[2],) ):
		#	crossSkills.append(row['id'])

	allSkills['native']=thisClass
	allSkills['cross']=crossSkills
	allSkills['specialist']=specialistSkills
	allSkills['iaijutsu']=iaijutsuSkills
	allSkills['summon']=summonSkills
	allSkills['discipline']=classSet[3]

	classes[classSet[0]] = allSkills

superstructure = {
'skills':skills,
'classes':classes,
'misc': misc
}

with open('db.json', 'w') as outfile:
	json.dump(superstructure, outfile)

with open('..\\client\\src\\db.js', 'w') as outfile:
	outfile.write("var db =")
	outfile.write(json.dumps(superstructure))


conn.commit()

conn.close()
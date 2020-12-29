import json
import os
import csv

# read json files
with open("db9.json", encoding="utf8") as f:
  data = json.load(f)


  skills = data['skills']
  classes = data['classes']

# Sanity Check:
sectionNames = set()
allSkills = set()
for skill in skills:
  allSkills.add(int(skill))

usedSkills = set()

for classi in classes:
  for section in classes[classi].items():
    sectionNames.add(section[0])

    if section[0] != 'discipline' and section[0] != 'id':
      for skill in section[1]:
        usedSkills.add(skill)

for skill in data['misc']:
  usedSkills.add(skill)

result  = allSkills.difference(usedSkills)

print("------------Unused Skills------------")

for r in result:
  print('id: ' + str(r) + ' name: ' + skills[str(r)]['name'])


# Duplicate skills:
sharedSkills = {}
for classi in classes:
  for section in classes[classi].items():
    sectionNames.add(section[0])

    if section[0] != 'discipline' and section[0] != 'id':
      for skill in section[1]:
        if skill in sharedSkills:
          sharedSkills[skill]=sharedSkills[skill]+1
        else:
          sharedSkills[skill]=1


print("------------Shared Skills------------")

for item in sharedSkills.items():
  if item[1] > 1:
    print(str(item[0])+ " " + str(item[1]) + ' name: ' + skills[str(item[0])]['name'])


print("------------Expander------------")

# result = {} 

# for classi in classes:

#     classSourceData = classes[classi]
#     classData = {}
#     classData['id'] = sourceObj['id']
#     classData['discipline'] = sourceObj['discipline']

#     skillData = []

#     for section in classes[classi].items():
#       if section[0] == 'discipline' or section[0] == 'id':
#         continue

#       for skill in section[1]:
#         if skill in sharedSkills:
#           sharedSkills[skill]=sharedSkills[skill]+1
#         else:
#           sharedSkills[skill]=1

    #classData["skills"] =
    #result[section[0]] = classData

print("------------Remap to skill name------------")
namedSkills = {}
for skill in skills:
  skillData = skills[skill]
  skillData["id"]=skill
  skillName = skillData["name"]
  if skillName in namedSkills:
    print(skillName + " already entered")
  namedSkills[skillName.lower()]=skillData

print("------------CSV Analysis------------")
matchedSkills = set()

gcd = set([58])
offGcd = set([0, 16, 20, 24, 4])
allCodes = gcd.union(offGcd)

csvSkills = {}

with open('Action.csv', newline='', encoding='UTF-8') as csvfile:
  reader = csv.DictReader(csvfile)
  for row in reader:
    skillName = row['Name']
    if skillName.lower() in namedSkills:
      matchedSkills.add(skillName.lower()) #int(namedSkills[skillName]["id"]))

      #print(row['CooldownGroup'])
      cooldownGroup = row['CooldownGroup']
      #if int(cooldownGroup) not in allCodes:
      #  print("Unknown: "+ cooldownGroup+ " " + skillName)
      #print(">>" + skillName)

      # Build a map of skills by skill name:
      if not skillName in csvSkills:
        csvSkills[skillName]=[]
      csvSkills[skillName].append(row)

print("------------Unmapped Skills------------")
print("------------Skills in json but not in csv------------")

allSkillNames = set(namedSkills.keys())
result = allSkillNames.difference(matchedSkills)
for r in result:
  print(r)

print("------------make map of DOH skills------------")
handSkills = set()
for classy in classes:
  classData = classes[classy]
  if classData["discipline"]=="hand" or classData["discipline"]=="land":
    for section in classData.items():
      if section[0] != 'discipline' and section[0] != 'id':
        for skill in section[1]:
          handSkills.add(skill)
          print(skill)

print("------------Update our skills------------")
for skill in skills:
  skillData = skills[skill]

  if skillData["category"]==7 or skillData["category"]==None or skillData["deprecated"]!=None or int(skill) in handSkills:
    continue

  skillName = skillData["name"]

  if not skillName in csvSkills:
    print("SKILL NOT FOUND: "+skillName)

  duplicateCount = 0
  duplicates = []
  for csvSkill in csvSkills[skillName]:
    if csvSkill["ClassJobLevel"]!="0" and csvSkill["ClassJobCategory"]!="":
      duplicateCount+=1
      duplicates.append(csvSkill)
    
  if duplicateCount==2:
    if duplicates[0]["ClassJob"]=="adventurer" and duplicates[1]["ClassJob"]!="adventurer":
      duplicateCount=1
      duplicates.remove(duplicates[0])
    if duplicates[1]["ClassJob"]=="adventurer" and duplicates[0]["ClassJob"]!="adventurer":
      duplicateCount=1
      duplicates.remove(duplicates[1])

  #count = len(csvSkills[skillName])
  if duplicateCount != 1:
    print(skillName +" "+ str(duplicateCount))

  skillData["c"]=duplicates[0]["#"]
  skillData["gcd"]=duplicates[0]["CooldownGroup"]=="58"
  skillData.pop("id")

with open('db10.json', 'w', encoding="utf8") as json_file:
    json.dump(data, json_file)

print("------------Skills in json but not in csv------------")

  #print('id: ' + str(r) + ' name: ' + skills[str(r)]['name'])
      #print(row['Name'], row['ActionProcStatus'])

  #for skill in data['classes']:
  #  print(skill)

# write csv table
#with open('result.csv', 'w', newline='') as f:
    #f.write(csv_content)

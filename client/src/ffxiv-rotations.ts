/// <reference path="jquery.d.ts"/>
/// <reference path="jqueryui.d.ts"/>

interface Number
{
	isInteger(value: any): boolean;
}

interface Cookie
{
	set(key: string, value: string): void;
	get(message: string) : string;
}

interface JQuery
{
	data(valueName: string): any;
	material_select(): void;
	pushpin(options: any): void;
	leanModal(): void;
}

interface MaterializeInterface
{
	toast(message:string, time:number) : void;
}

declare var db: any;
declare var Materialize: MaterializeInterface;
declare var Cookies: Cookie;

// This controls the initial class (if none are specified in the url)
var selectedClass: string = 'Monk';
var selectedClassId: number;

var base = "0123456789abcdefghijklmnopqrstuvwxyz";

function toURLBase(num : number) : string
{
	var radix = base.length;
	var digits ="";
	while(num!=0)
	{
		digits = base[num % radix] + digits;
		num = Math.floor(num / radix);
	}
	return digits;
}

function fromURLBase(num : string) : number
{
	num = num.toLowerCase();
	var radix = base.length;
	var sum = 0;
	var accum = 1;
	for(var i=num.length-1; i>=0; i--)
	{
		sum+=base.indexOf(num[i]) * accum;
		accum*=radix;
	}
	return sum;
}

class Skill
{
	id: number;
	name: string;
	help_html: string;
	level: number;
	cast_time: number;
	recast_time: number;
	cost: any;
	cast_range: number;
	icon: string;
	category: number;
	radius: number;
	multiIcon: Boolean;
	cross_class_skill: number;
	deprecated: Boolean;

	displayName(): string
	{
		return this.name.replace("{class}", selectedClass);
	}

	iconPath(): string
	{
		if(this.multiIcon)
		{
			return 'icon/' + this.icon+(selectedClassId-8)+'.png';
		}
		else
		{
			return 'icon/' + this.icon+'.png';
		}
	}

	resourceType(): string
	{
		switch(this.category)
		{
			case 2:
				return 'MP';
				break;
			case 3:
				return 'TP';
				break;
			case 4:
				return '';
				break;
			case 6:
				return 'GP';
				break;
			case 7:
				return 'CP';
				break;
		}
	}

	isCombatantSkill(): boolean
	{
		return this.category==2 || this.category==3 || this.category==4 || this.category==undefined;
	}

	isCrossClassSkill(): boolean
	{
		return db['classes'][selectedClass]['cross'].indexOf(this.id)!=-1;
	}
}

function getSkill(skillId: number) : Skill
{
	var skill: Skill = new Skill();
	var dbSkill: any = db['skills'][skillId];
	skill.id = skillId;
	skill.name = dbSkill.name;
	skill.help_html = dbSkill.help_html;
	skill.level = dbSkill.level;
	skill.cast_time = dbSkill.cast_time;
	skill.recast_time = dbSkill.recast_time;
	skill.cost = dbSkill.cost;
	skill.cast_range = dbSkill.cast_range;
	skill.icon = dbSkill.icon;
	skill.category = dbSkill.category;
	skill.radius = dbSkill.radius;
	skill.cross_class_skill = dbSkill.cross_class_skill
	if(dbSkill.deprecated)
	{
		skill.deprecated = true;
	}

	if(dbSkill['multiIcon'])
	{
		skill.multiIcon = true;
	}

	return skill;
}

function hasError(jsonResponse: any) : Boolean
{
	return 'error' in jsonResponse;
}

function pluralize(noun: string, count: number)
{
	return count==1 ? '1 ' + noun : count.toString() + ' ' + noun + 's';
}

function createSkillInfoMouseOver(item: JQuery, mouseOverSkill: Skill)
{
	item.hover(function()
	{
		var skill = mouseOverSkill;

		// If we are looking at a cross class skill, get the details for the un-enhanced version:
		if(skill.isCrossClassSkill() && skill.cross_class_skill!=undefined)
		{
			skill = getSkill(skill.cross_class_skill)
		}

		$('#skillInfo .skillIcon').attr('src', skill.iconPath());
		$('#skillName').html(skill.displayName());
		$('#skillDescription').html(skill.help_html);

		var displayProperties: any [][] = [
			["Level", skill.level!=null, function(){ return skill.level.toString(); }],
			["Cast", skill.cast_time!=null && skill.isCombatantSkill(), function()
			{
				if(skill.cast_time==0)
				{
					return 'Instant';
				}
				return pluralize('second', skill.cast_time);
			}],
			["Recast", skill.recast_time!=null && skill.isCombatantSkill(), function()
			{
				return pluralize('second', skill.recast_time);
			}],
			["Cost", skill.cost!=null, function()
			{
				if(typeof skill.cost ==="number") //#(Number.isInteger(skill.cost))
				{
					return skill.cost + ' ' + skill.resourceType();
				}
				else
				{
					return skill.cost;
				}
			}],
			["Range", skill.cast_range!=null && skill.isCombatantSkill(), function()
			{
				var range: number = skill.cast_range;
				if(range==-1)
				{
					switch(selectedClass)
					{
						case 'Bard':
						case 'Machinist':
							range = 25;
							break;
						default:
							range = 3;
							break;
					}
				}
				return pluralize('yalm', range);
			}],
			["Radius", skill.radius!=null && (skill.category==2 || skill.category==3 || skill.category==4), function()
			{
				return pluralize('yalm', skill.radius);
			}]
			];

		$("#skillProperties").empty();
		$.each(displayProperties, function(index, value)
		{
			if(value[1])
			{
				var row = $("#skillProperties").append($('<tr>').append(
					$('<td>').text(value[0]),
					$('<td>').text(value[2]())
				));
			}
		});

		$('#skillInfo').slideDown();
	});
}

// Creates a div that contains an icon of the given skill.
// The skill index is required as this is used to encode the url.
// Cross indicates this skill index is for a cross class skill
function createSkillDiv(id: number) : JQuery
{
	var skill: Skill = getSkill(id);

	var newDiv = $('<div class="skillIcon">');

	newDiv.css('background-image', 'url('+skill.iconPath()+')');
	newDiv.data('id', id);

	// If we're dealing with a GCD skill, show a little icon:
	// Temporarily disabled until GCDs are confirmed.
	// if(skill.recast_time==3)
	// {
//		newDiv.append('<i class="material-icons gcd">replay</i>')
	// }

	createSkillInfoMouseOver(newDiv, skill);
	return newDiv;
}

// Create a skill for the skill selector section.
// It will contain the icon as well as the skill name, level
function createSkillSelectorDiv(skill:Skill, cross:boolean)
{
	var skillName = skill.displayName();
	var skillLevel = skill.level;

	var containerDiv = $('<div class="skillSelectorItem">');

	var textDiv = $('<div class="miniInfo truncate">').html(skillName+'<br/>Lv. '+ (skillLevel ? skillLevel.toString() : 'any'));

	var skillIconContainerDiv = $('<div class="skillIconContainer">');
	skillIconContainerDiv.append(createSkillDiv(skill.id));

	containerDiv.append(skillIconContainerDiv);
	containerDiv.append(textDiv);

	return containerDiv;
}

// Copies the skill icon div.
// This is done when you grab one from the skill selector.
function copySkillDiv(skillDiv: JQuery)
{
	return createSkillDiv(skillDiv.data('id'));
}

// Given a string that represents a sequence of skills, display it on the page.
function applyModel(act: string)
{
	if(act!=undefined && act.length>0)
	{
		var ids: string[] = act.split(',');

		for(var i = 0; i < ids.length; i++)
		{
			var id: number = parseInt(ids[i]);
			var skillDiv: JQuery = createSkillDiv(id);
			$('#sortable').append(skillDiv);
		}
	}

	updateClassSelect();
	updateArrows();
}

// Updates the materialize class selector.
// This must be done after the value of selectedClass changes.
function updateClassSelect()
{
	$('#class').val(selectedClass);
	$('#class').material_select();
}

// Returns a string that represents this sequence of skills
// Does not include class information
function getSkillSequenceString()
{
	var ids: string[] = [];
	$.each($('#sortable .skillIcon'), function(index, value)
	{
		ids.push($(value).data('id'));
	});

	return ids.join();
}

// Updates the text at the bottom of the screen that informs of the number of visitors to this page.
function setVisits(count: number)
{
	if(count==-1)
	{
		$("#hits").text('0 views of this skill sequence - share the link!');
	}
	else
	{
		$("#hits").text((+count)+' views of this skill sequence');
	}
}

// Sets if the sequence has been modified. If modified, enable sharing.
function setModified(modified: Boolean)
{
	if(modified===true)
	{
		$('#share').removeClass('disabled');
	}
	else
	{
		$('#share').addClass('disabled');
	}
}

// Call this function whenever the content of the skill bar changes
// This will update the url of the page
function modelUpdate()
{
	setModified(true);

	updateArrows();

	var skillSequenceString = getSkillSequenceString();

	Cookies.set(selectedClass, skillSequenceString);
}

// Given a class name returns the path to the class icon file.
function getClassIcon(className: string): string
{
	var classIcon = 'classIcons/'+className.replace(/\s/g, '').toLowerCase() + '3.png';
	return classIcon;
}

function sortSkillsByLevel(skillIdList: number[])
{
	skillIdList.sort(function(a:number, b: number)
	{
	   var skillA:Skill = getSkill(a);
	   var skillB:Skill = getSkill(b);

		return skillA.level - skillB.level;
	});
}

function populateSkillSection(divId: string, skillIds: number[])
{
	if(skillIds==undefined || !skillIds.length)
	{
		$(divId).parent().parent().hide();
		return;
	}

	$(divId).parent().parent().show();
	sortSkillsByLevel(skillIds);

	$.each(skillIds, function(index, skillIndex)
	{
		var skill:Skill = getSkill(skillIndex);
		if(!skill.deprecated)
		{
			$(divId).append(createSkillSelectorDiv(skill, false));
		}
	});
}

function populateSkillSelector()
{
	// Populate the skill selector.
	populateSkillSection('#classSkills', db['classes'][selectedClass]['native']);
	populateSkillSection('#iaijutsuSkills', db['classes'][selectedClass]['iaijutsu']);
	populateSkillSection('#summonSkills', db['classes'][selectedClass]['summon']);
	populateSkillSection('#specialistSkills', db['classes'][selectedClass]['specialist']);
	populateSkillSection('#ninjutsuSkills', db['classes'][selectedClass]['ninjutsu']);
	populateSkillSection('#stepSkills', db['classes'][selectedClass]['step']);
	populateSkillSection('#crossClassSkills', db['classes'][selectedClass]['cross']);
	if(db.classes[selectedClass].discipline!='hand' && db.classes[selectedClass].discipline!='land')
	{
		populateSkillSection('#miscSkills', db['misc']);
	}
	else
	{
		populateSkillSection('#miscSkills', []);
	}

	$('.skillSelector .skillIcon').draggable(
	{
		helper: function(e: Event)
		{
			return copySkillDiv($(e.target));
		},
		connectToSortable: "#sortable",
		distance: 5
	});

	// If a skill in the skill selector bar is clicked, add it to the sequence
	$('.skillSelectorItem').on('click', function(e)
	{
		$('#sortable').append(copySkillDiv($(this).find('.skillIcon')));
		modelUpdate();
	});
}

// Removes all actions from the sequence
// Does not call model update!
function clearSequence()
{
	$('#sortable').empty();
}

function updateArrows()
{
	$('#sortable .arrow').remove();

	$('#sortable .skillIcon:not(.ui-sortable-helper)').each(function( index, element )
	{
		// TODO: Show skill index
	}).after($('<div class="arrow">'));
}

$(function()
{
	$('.modal-trigger').leanModal();
	$('#skillInfo').pushpin({ top: $('#skillInfo').offset().top });
	$('#skillInfo').hide();

	// Respond to the clear button being clicked
	$('#clear').click(function()
	{
		clearSequence();
		modelUpdate();
	});

	$('#share').click(function()
	{
		$.get("share.py",
			{ class: selectedClass, sequence: getSkillSequenceString() }
			).done(function(data)
			{
				if(!hasError(data))
				{
					history.replaceState( { }, '', '/'+toURLBase(data.id));
					setModified(false);
					Materialize.toast('URL updated!', 6000);
					setVisits(data.hits);
				}
			});
	});

	// Respond to the class selection being changed:
	$('#class').change(function()
	{
		selectedClass = $('#class').val();
		selectedClassId = db['classes'][selectedClass]['id'];
		clearSequence();

		var cookie = Cookies.get(selectedClass);

		if(cookie!=undefined)
		{
			applyModel(cookie);
		}

		$('.skillSelector').empty();
		populateSkillSelector();
		modelUpdate();
	});

	var removeIntent : Boolean = false;

	$('#sortable').sortable(
	{
		items: ".skillIcon",
		placeholder: 'skillIcon block-placeholder',
		distance: 5,
		stop: function(event, ui)
		{
			modelUpdate();
		},
		tolerance: "pointer",
		over: function ()
		{
			removeIntent = false;
		},
		out: function ()
		{
			removeIntent = true;
		},
		beforeStop: function(event, ui)
		{
		   if(removeIntent == true)
		   {
				ui.item.remove();
		   }
		},
		change: function(event, ui)
		{
			updateArrows();
			/*
			console.log("beforeStop");
			var blah = ui.item.clone(true);
			ui.item.replaceWith($("<span>").text('>').append(blah));
			*/
		}

	});

	$('#sortable').disableSelection();

	// If a skill in the sequence is clicked, remove it from the sequence
	$('#sortable').on('click', 'div', function(e)
	{
		$(e.target).remove();
		modelUpdate();
	});

	// Load the sequence data:
	var i = location.pathname.lastIndexOf('/');
	var idUrl = location.pathname.substring(i + 1);
	var id = fromURLBase(idUrl)

	var getDatabase = $.getJSON( "db.json");
	var getSequenceData = $.get("load.py", { id: id });

	$.when(getDatabase, getSequenceData).done(function ( response1, response2 )
	{
		db = response1[0];
		var data = response2[0];

		if(!hasError(data))
		{
			selectedClass = data.class;
			applyModel(data.sequence);
			setVisits(data.hits);
		}

		console.log("got both data");
		populateSkillSelector();

		// Populate the class selector:
		$.each(db['classes'], function(key, value)
		{
			var optGroupString = '#' + value.discipline + 'Selector';
	
			$(optGroupString)
			.append($("<option></option>")
			.attr("value", key)
			.attr("data-icon", getClassIcon(key))
			.attr("class", "left")
			.text(key));
		});
		updateClassSelect();
	});
});

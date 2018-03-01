# Disclaimer
These scripts are meant for use on game sites such as Bustabit.com and Raigames.io, by using these scripts you acknowledge that I will accept no responsibility or liability for any losses which may be incurred by any person or persons using the whole or any part of my scripts, whether caused by bad luck on the site or a bug in the script.
You do have permission to redistribute my scripts but please do not claim them as your own.

# Script User Interface
![screenshot 95](https://user-images.githubusercontent.com/35207683/35952872-1853d4ec-0c50-11e8-852c-499be9ea48eb.png)

This Script for RaiGames and Ethcrash feature a user interface that displays certain statistics, this interface will be under constant improvement so be sure to check for new features.  It can be moved around the screen by clicking and dragging the top header where it says Script Stats. A couple undates that I am working on for the UI is a minimize button, several more statistics to display, and the ability to change script variables at runtime.

# How the script works
Whereas alot of scripts have a base bet that you set, mine do not have that you enter the total amount of bits you want the script to use instead and then the script will automatically compute what the base bet should be.

# 4x Script
The way the 4x Script functions is that on a loss it will multiply the base bet by 4 and then will compute what it needs to set the crash at to break even.  Therefore this script will only bring you profit on winning the first bet, and will only attempt to break even on the subsequent bets on a loss streak. However you can still gain a small profit in loss streaks via bonuses.

# 1.25x Script
This script is very similar to the 4x script however it will multiply the bet by 4x on the first loss and then by 5x on every subsiqent loss. It will also stay at 1.25x for every loss.

# Gambler Fallacy Script
![screenshot 109](https://user-images.githubusercontent.com/35207683/36823696-5ff29266-1ccc-11e8-87e7-7e0441eeef4b.png)

This script is designed to generate previous game crashes and then will look through them to find the number of busts at a given multiplier that are statistically due to not appear again for a while and bet on that multiplier, then it will check after every game for a better multiplier.  If all patterns are statistically due to appear again soon the script will not bet at all until a pattern appears.
  
# Script set up
## Raigames and Ethcrash
To set it up you simply navigate to the custom bet section in the auto tab and delete everything in there and paste it in.
## BustABit
For BustABit you have to copy the entire script and paste it under the var config = {} part, you can delete the log('simulation begins here') if you want
  
### Contact
If you have any questions,comments or concerns feel free to contact me on discord at "8 ฿ł₮ ₮Ɽł₱#6510"

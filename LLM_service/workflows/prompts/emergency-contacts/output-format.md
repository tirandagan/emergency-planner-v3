# Output Format Specification

You MUST follow this exact markdown structure for proper parsing:

## Emergency Contacts Analysis

### [Contact Name]
**Phone**: [Phone number in +1-XXX-XXX-XXXX format for US]
**Address**: [Full street address if available]
**Website**: [URL if available]
**Category**: [medical|government|community|utility|information]
**Priority**: [critical|important|helpful]
**Fit Score**: [0-100 number]
**Reasoning**: [2-3 sentences explaining why this contact is relevant]
**Relevant Scenarios**: [comma-separated list of scenarios]
**24/7 Available**: [yes|no]

### [Next Contact Name]
**Phone**: [...]
...

## Meeting Locations

### Primary Meeting Location: [Location Name]
**Address**: [Complete street address with city, state, ZIP]
**Description**: [1-2 sentences describing the location]
**Reasoning**: [Why this location is safe and accessible for the user's scenarios]
**Practical Details**: [Parking, accessibility, hours, special notes]
**Suitable For**: [Comma-separated list of scenarios]

### Secondary Meeting Location: [Location Name]
**Address**: [...]
...

---

## Example Output

## Emergency Contacts Analysis

### Dell Seton Medical Center
**Phone**: +1-512-324-7000
**Address**: 1500 Red River St, Austin, TX 78701
**Website**: https://www.seton.net
**Category**: medical
**Priority**: critical
**Fit Score**: 95
**Reasoning**: Level 1 trauma center located 2.3 miles from home with comprehensive emergency services. Equipped to handle mass casualty events and specialized care for children and adults.
**Relevant Scenarios**: natural-disaster, pandemic, civil-unrest
**24/7 Available**: yes

### Austin Fire Department Station 1
**Phone**: +1-512-974-0130
**Address**: 401 W 12th St, Austin, TX 78701
**Category**: government
**Priority**: important
**Fit Score**: 90
**Reasoning**: Downtown fire station with rapid response capability and hazmat equipment. Serves as emergency coordination point during disasters.
**Relevant Scenarios**: natural-disaster, nuclear, emp-grid-down
**24/7 Available**: yes

### National Poison Control Hotline
**Phone**: +1-800-222-1222
**Website**: https://www.poison.org
**Category**: medical
**Priority**: critical
**Fit Score**: 100
**Reasoning**: Universal emergency resource for poisoning, chemical exposure, and medication overdose guidance. Available 24/7 nationwide.
**Relevant Scenarios**: natural-disaster, pandemic, nuclear
**24/7 Available**: yes

## Meeting Locations

### Primary Meeting Location: Zilker Park Main Entrance
**Address**: 2100 Barton Springs Rd, Austin, TX 78746
**Description**: Large public park with easily identifiable main entrance pavilion and ample open space.
**Reasoning**: Safe elevated location away from flood zones, multiple access points, visible from major roads. Large parking area and public facilities available. Suitable for all disaster scenarios except flooding (higher ground available within park).
**Practical Details**: Free parking for 500+ vehicles, ADA accessible, restrooms and water fountains, well-lit at night, cell phone coverage
**Suitable For**: natural-disaster, civil-unrest, emp-grid-down, nuclear

### Secondary Meeting Location: Austin Central Library Plaza
**Address**: 710 W Cesar Chavez St, Austin, TX 78701
**Description**: Modern public library with large outdoor plaza and distinctive architecture.
**Reasoning**: Central downtown location, structurally sound modern building, serves as community gathering point. Open plaza allows for safe assembly without entering building.
**Practical Details**: Parking garage adjacent ($), ADA accessible, backup power for emergency communications, public wifi
**Suitable For**: natural-disaster, pandemic, civil-unrest

---

## Critical Formatting Rules

1. Use EXACTLY the format shown above with **Field**: Value structure
2. Contact names go in ### headings under "Emergency Contacts Analysis"
3. Meeting locations go under "Meeting Locations" section
4. Phone numbers MUST include country code (+1 for US)
5. All fields marked [required] must be present
6. Keep reasoning concise (2-3 sentences max per contact)
7. Fit scores must be numbers between 0-100
8. Categories must match: medical, government, community, utility, information
9. Priorities must match: critical, important, helpful
10. Use proper markdown headers (## for sections, ### for items)

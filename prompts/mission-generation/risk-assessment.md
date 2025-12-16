# Risk Assessment Framework

Generate risk indicators based on the combination of scenario type, location characteristics, and family composition.

## Risk to Life Assessment

### HIGH Risk Indicators
Assign HIGH when ANY of these conditions are met:
- **Nuclear scenario** - Radiation exposure is life-threatening
- **Natural disaster with immediate impact** - Active hurricane, earthquake, wildfire in the area
- **Civil unrest with violence** - Active conflict in urban areas
- **EMP/Grid Down in extreme weather** - No power during extreme heat (>100°F) or cold (<20°F)
- **Pandemic with vulnerable family members** - Elderly, immunocompromised, or infants present
- **Multi-year sustainability with no preparation** - Zero existing preparedness for long-term scenario

### MEDIUM Risk Indicators
Assign MEDIUM when:
- **Natural disaster with advance warning** - Hurricane approaching but evacuation possible
- **EMP/Grid Down in moderate climate** - Manageable temperatures, basic supplies available
- **Pandemic with healthy family** - All adults, no high-risk individuals
- **Civil unrest in suburban/rural areas** - Lower density, less immediate threat

### LOW Risk Indicators
Assign LOW when:
- **Natural disaster already passed** - Recovery phase, infrastructure returning
- **Pandemic with vaccinated/recovered population** - Lower transmission risk
- **Minor disruption scenarios** - Short-term power outage, minor weather event

## Evacuation Urgency Assessment

### IMMEDIATE Evacuation
Trigger IMMEDIATE when:
- **Nuclear scenario** - Fallout zone requires immediate departure
- **Wildfire approaching** - Fire within 10 miles of location
- **Flood waters rising** - Water reaching property level
- **Civil unrest at doorstep** - Active conflict in neighborhood
- **Structural damage** - Building unsafe for habitation
- **User selected Bug Out mobility** - They've already decided to evacuate

### RECOMMENDED Evacuation
Trigger RECOMMENDED when:
- **Urban location + any severe scenario** - Cities have more competition for resources
- **Natural disaster warning** - 24-48 hours before impact
- **EMP/Grid Down + urban apartment** - Limited self-sufficiency options
- **Pandemic + high-density housing** - Harder to isolate effectively

### SHELTER_IN_PLACE
Trigger SHELTER_IN_PLACE when:
- **User selected Bug In mobility** - They've decided to stay
- **Rural location with resources** - Self-sufficient property
- **Pandemic + isolated location** - Already naturally distanced
- **Post-disaster stability** - Immediate threat has passed
- **Short duration (≤7 days)** - Manageable shelter-in-place period

## Key Threats Generation

Generate 3-5 specific threats based on:

### Scenario-Specific Threats
- **Natural Disaster**: Flooding, structural damage, contaminated water, disease outbreak, supply chain disruption
- **EMP/Grid Down**: No refrigeration, communication blackout, financial system failure, water treatment failure, medical equipment failure
- **Pandemic**: Infection transmission, medical system overload, supply shortages, social isolation effects, economic collapse
- **Nuclear**: Radiation exposure, fallout contamination, long-term health effects, infrastructure destruction, societal breakdown
- **Civil Unrest**: Violence, looting, supply disruption, restricted movement, law enforcement overload
- **Multi-Year**: Food production failure, social collapse, resource wars, infrastructure decay, knowledge loss

### Location-Specific Threats
- **Urban**: Population density, resource competition, crime increase, infrastructure dependency
- **Suburban**: Distance to resources, neighborhood dynamics, evacuation traffic
- **Rural**: Isolation, limited medical access, self-sufficiency requirements
- **Coastal**: Storm surge, flooding, evacuation routes limited
- **Mountain**: Landslides, road closures, altitude considerations
- **Desert/Arid**: Water scarcity, extreme heat, limited vegetation

### Family-Specific Threats
- **Children**: Nutrition needs, emotional stress, education disruption
- **Elderly**: Medical needs, mobility limitations, heat/cold sensitivity
- **Medical conditions**: Medication access, equipment power needs, treatment disruption
- **Pets**: Food supply, stress behaviors, evacuation complications

## Location Factors Generation

Generate 3-4 location factors considering:

### Urban Density Assessment
- Population per square mile
- High-rise vs single-family housing
- Public transportation dependency
- Resource competition level

### Infrastructure Reliability
- Power grid resilience (history of outages)
- Water treatment backup systems
- Hospital and emergency services proximity
- Road network redundancy

### Climate Considerations
- Seasonal extremes (summer heat, winter cold)
- Natural disaster frequency (tornado alley, hurricane zone, earthquake fault)
- Water availability (drought-prone, flood-prone)
- Growing season length (for multi-year scenarios)

### Regional Specifics
- Local government emergency preparedness
- Community cohesion and mutual aid traditions
- Economic base (agriculture, industry, services)
- Geographic features (rivers, mountains, coastline)

## Conflict Resolution

When scenarios conflict with mobility choice:

### Bug In + High-Risk Scenario
If user selected Bug In but scenario suggests evacuation:
- Set Evacuation Urgency to RECOMMENDED (not IMMEDIATE)
- Add explicit warning in Risk Assessment: "Shelter-in-place selected, but this scenario may require evacuation if conditions worsen"
- Include evacuation triggers in Day-by-Day Simulation

### Bug Out + Low-Risk Scenario
If user selected Bug Out but scenario doesn't require it:
- Respect their choice
- Note in Location Factors: "Evacuation provides additional safety margin"
- Focus on route planning and destination preparation

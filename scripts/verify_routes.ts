
import { generateSurvivalPlan } from '../src/app/actions';
import { ScenarioType, MobilityType } from '../src/types';

// dotenv.config({ path: '.env.local' }); // Removed, loading via shell


async function verify() {
    console.log("Starting verification...");
    try {
        const plan = await generateSurvivalPlan(
            4,
            "Austin, TX",
            3,
            [ScenarioType.NATURAL_DISASTER],
            MobilityType.BUG_OUT_VEHICLE,
            [],
            2000,
            "Medium Term"
        );

        console.log("Plan generated.");
        const routes = plan.evacuationRoutes;
        console.log(`Total routes: ${routes.length}`);

        const vehicleRoutes = routes.filter(r => r.type.toLowerCase() === 'vehicle');
        const footRoutes = routes.filter(r => r.type.toLowerCase() === 'foot');

        console.log(`Vehicle routes: ${vehicleRoutes.length}`);
        console.log(`Foot routes: ${footRoutes.length}`);

        if (vehicleRoutes.length === 2 && (footRoutes.length === 1 || footRoutes.length === 2)) {
            console.log("SUCCESS: Route counts match requirements.");
        } else {
            console.log("FAILURE: Route counts do not match requirements.");
            console.log("Routes:", JSON.stringify(routes, null, 2));
        }

    } catch (error) {
        console.error("Verification failed with error:", error);
    }
}

verify();

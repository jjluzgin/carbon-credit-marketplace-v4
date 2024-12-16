import { NavBar } from "./NavBar";
import ProjectSubmissionCard from "./ProjectAdd";

export default function MarketplaceDashboard(){
    return (
        <div className="min-h-screen flex flex-col">
            <div className="flex-grow container mx-auto p-4">
                <NavBar/>
            </div>
            <div>
                <ProjectSubmissionCard/>
            </div>
        </div>
    )
}
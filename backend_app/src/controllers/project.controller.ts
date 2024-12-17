import { NextFunction, Request, Response } from "express";
import { Project } from "../entity/Project.entity";
import { AppDataSource } from "../data-source";
import * as cache from "memory-cache";
import { ProjectStatus } from "../constants";


export class ProjectController{
    static async projectAdd(req: Request, res: Response){
        const {projectId, owner, verificationId, status, carbonReduction, ipfsCID} = req.body;

        const project = new Project();
        project.projectId = projectId;
        project.owner = owner,
        project.verificationId = verificationId,
        project.ipfsCID = ipfsCID,
        project.carbonRemoved = carbonReduction,
        project.status = status

        const projectRepository = AppDataSource.getRepository(Project);
        await projectRepository.save(project);

        return res
            .status(200)
            .json({message: "Project added succesfully"})
    }

    static async getPendingProjects(req: Request, res: Response){
        const data = cache.get("pendingProjects");
        if(data){
            console.log("serving from db");
            res.status(200).json({
                data
            });
            return; 
        }else{
            console.log("serving from db");
            const projectRepository = AppDataSource.getRepository(Project);
            const pendingProjects = await projectRepository.find({where: {status: ProjectStatus.Pending}});
            cache.put("pendingProjects", pendingProjects, 6000);
            res.status(200).json({
                data: pendingProjects,
            });
            return; 
        }
    }
}
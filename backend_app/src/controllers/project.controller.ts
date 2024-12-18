import { NextFunction, Request, Response } from "express";
import { Project } from "../entity/Project.entity";
import { AppDataSource } from "../data-source";
import * as cache from "memory-cache";
import { ProjectStatus } from "../constants";
import {
  PendingProjectDto,
  UserProjectDto,
} from "../../../shared/types/ProjectDto";

export class ProjectController {
  static async addProject(req: Request, res: Response) {
    const {
      projectId,
      owner,
      verificationId,
      status,
      carbonReduction,
      ipfsCID,
    } = req.body;
    // Explicitly handle zero case
    const parsedProjectId = projectId === "0" ? 0 : parseInt(projectId);
    if (isNaN(parsedProjectId)) {
      res.status(400).json({ message: "Invalid projectId" });
      return;
    }

    const project = new Project();
    project.projectId = parsedProjectId;
    project.owner = owner;
    project.verificationId = verificationId;
    project.ipfsCID = ipfsCID;
    project.carbonRemoved = parseInt(carbonReduction);
    project.status = parseInt(status);

    const projectRepository = AppDataSource.getRepository(Project);
    await projectRepository.save(project);

    res.status(200).json({ message: "Project added succesfully" });
    return;
  }

  static async getPendingProjects(req: Request, res: Response) {
    const data = cache.get("pendingProjects");
    if (data) {
      console.log("serving from cache");
      res.status(200).json({
        projects: data,
      });
      return;
    } else {
      console.log("serving from db");
      const projectRepository = AppDataSource.getRepository(Project);
      const pendingProjects = await projectRepository.find({
        where: { status: ProjectStatus.Pending },
      });
      const dto: PendingProjectDto[] = pendingProjects.map((project) => ({
        projectId: project.projectId,
        verificationId: project.verificationId,
        ipfsCID: project.ipfsCID,
        carbonRemoved: project.carbonRemoved,
      }));
      cache.put("pendingProjects", dto, 60000);
      res.status(200).json({
        projects: dto,
      });
      return;
    }
  }

  static async getUserProjects(req: Request, res: Response) {
    const { owner } = req.params;
    const cacheKey = `userProjects_${owner}`;
    try {
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log("serving from cache");
        res.status(200).json({ projects: cachedData });
        return;
      }
      console.log("serving from db");
      const allProjects = AppDataSource.getRepository(Project);
      const userProjects = await allProjects.find({ where: { owner: owner } });
      const dto: UserProjectDto[] = userProjects.map((project) => ({
        verificationId: project.verificationId,
        ipfsCID: project.ipfsCID,
        status: project.status,
        carbonRemoved: project.carbonRemoved,
        creditsIssued: project.creditsIssued,
        authenticationDate: project.authenticationDate,
      }));
      cache.put(cacheKey, dto, 60000);
      res.status(200).json({ projects: dto });
      return;
    } catch (error) {
      console.error("Error fetching user projects:", error);
      res.status(500).json({
        message: "An error occurred while fetching user projects.",
      });
      return;
    }
  }

  static async updateProject(req: Request, res: Response) {
    const { projectId } = req.params;
    const id = parseInt(projectId, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid projectId" });
      return; 
    }
    const { auditor, creditsIssued, status, authenticationDate } = req.body;
    const creditsIssuedInt = parseInt(creditsIssued, 10);
    const authenticationDateInt = parseInt(authenticationDate, 10);
    if (!auditor || isNaN(status) || isNaN(authenticationDateInt) || isNaN(creditsIssuedInt)) {
      res.status(400).json({ message: "Missing or invalid fields in request body" });
      return; 
    }
    try{
      const projectRepo = AppDataSource.getRepository(Project);
      const project = await projectRepo.findOne({where: { projectId: id }});
      project.auditor = auditor;
      project.status = status;
      project.creditsIssued = creditsIssuedInt;
      project.authenticationDate = authenticationDateInt;
      const updatedProject =await projectRepo.save(project);
  
      res.status(200).json({ message: "Project updated successfully", project: updatedProject });
      return;
    }catch (error){
      console.error("Error updating project:", error);
      res.status(500).json({ message: "An error occurred while updating the project" });
      return;
    }
  }
}

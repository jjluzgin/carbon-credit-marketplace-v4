// {isAuditor && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Accept Project</CardTitle>
//             <CardDescription>
//               Accept project to allow minting credits
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               <Input
//                 placeholder="Project ID"
//                 value={projectId}
//                 type="number"
//                 onChange={(e) =>
//                   setProjectId(
//                     e.target.value ? parseInt(e.target.value, 10) : undefined,
//                   )
//                 }
//               />
//             </div>
//           </CardContent>
//           <CardFooter className="flex justify-end">
//             <Button
//               onClick={handleProjectAccept}
//               disabled={isSubmitting}
//               className="bg-blue-500 text-white hover:bg-blue-600"
//             >
//               {isSubmitting ? "Accepting..." : "Accept Project"}
//             </Button>
//           </CardFooter>
//         </Card>
//       )}
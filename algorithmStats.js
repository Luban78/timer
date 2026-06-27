export function getAlgorithmStats(solves){

  const stats = {};

  solves.forEach(solve=>{

    if(!solve.algorithm || solve.algorithm==="Nevybráno") return;

    if(!stats[solve.algorithm]){
      stats[solve.algorithm]={
        count:0,
        best:Infinity,
        total:0
      };
    }

    stats[solve.algorithm].count++;
    stats[solve.algorithm].best=Math.min(
      stats[solve.algorithm].best,
      solve.time
    );
    stats[solve.algorithm].total+=solve.time;

  });

  return Object.entries(stats)
    .map(([name,data])=>({
      name,
      count:data.count,
      best:data.best,
      avg:data.total/data.count
    }))
    .sort((a,b)=>b.count-a.count);

}
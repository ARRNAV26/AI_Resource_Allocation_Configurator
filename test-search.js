// Test script for search functionality
const testData = {
  clients: [
    { ClientID: 'C001', ClientName: 'Acme Corp', PriorityLevel: 1, ContactEmail: 'acme@example.com', GroupTag: 'Enterprise' },
    { ClientID: 'C002', ClientName: 'TechStart', PriorityLevel: 3, ContactEmail: 'tech@example.com', GroupTag: 'Startup' }
  ],
  workers: [
    { WorkerID: 'W001', WorkerName: 'John Smith', Skills: 'Python,JavaScript', WorkerGroup: 'Senior-Consultants' },
    { WorkerID: 'W002', WorkerName: 'Jane Doe', Skills: 'Java,Python', WorkerGroup: 'Junior-Consultants' }
  ],
  tasks: [
    { TaskID: 'T001', TaskName: 'Web Development', RequiredSkills: 'JavaScript,HTML,CSS', Priority: 2 },
    { TaskID: 'T002', TaskName: 'Data Analysis', RequiredSkills: 'Python,SQL', Priority: 1 }
  ]
};

// Test search queries that should match the data
const testQueries = [
  'Acme Corp',
  'Python',
  'JavaScript',
  'Enterprise',
  'Web Development',
  'Data Analysis',
  'John Smith',
  'Jane Doe'
];

console.log('Testing search functionality...\n');

testQueries.forEach(query => {
  console.log(`Query: "${query}"`);
  
  // Simple fallback search logic
  const lowerQuery = query.toLowerCase();
  let results = [];
  
  // Search clients
  const clientResults = testData.clients.filter(client => 
    client.ClientName?.toLowerCase().includes(lowerQuery) ||
    client.ClientID?.toLowerCase().includes(lowerQuery) ||
    client.ContactEmail?.toLowerCase().includes(lowerQuery) ||
    client.GroupTag?.toLowerCase().includes(lowerQuery)
  );
  
  // Search workers
  const workerResults = testData.workers.filter(worker => 
    worker.WorkerName?.toLowerCase().includes(lowerQuery) ||
    worker.WorkerID?.toLowerCase().includes(lowerQuery) ||
    worker.Skills?.toLowerCase().includes(lowerQuery) ||
    worker.WorkerGroup?.toLowerCase().includes(lowerQuery)
  );
  
  // Search tasks
  const taskResults = testData.tasks.filter(task => 
    task.TaskName?.toLowerCase().includes(lowerQuery) ||
    task.TaskID?.toLowerCase().includes(lowerQuery) ||
    task.RequiredSkills?.toLowerCase().includes(lowerQuery)
  );
  
  results = [...clientResults, ...workerResults, ...taskResults];
  
  console.log(`Found ${results.length} results:`);
  results.forEach(result => {
    if (result.ClientID) {
      console.log(`  - Client: ${result.ClientName} (${result.ClientID})`);
    } else if (result.WorkerID) {
      console.log(`  - Worker: ${result.WorkerName} (${result.WorkerID})`);
    } else if (result.TaskID) {
      console.log(`  - Task: ${result.TaskName} (${result.TaskID})`);
    }
  });
  console.log('');
});

console.log('Search test completed!'); 
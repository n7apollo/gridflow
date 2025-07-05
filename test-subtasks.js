/**
 * Test script for subtask functionality
 * Run this in the browser console to test the new subtask system
 */

async function testSubtaskSystem() {
    console.log('=== TESTING SUBTASK SYSTEM ===');
    
    const { 
        createEntity, 
        addSubtask, 
        getSubtasks, 
        getParentEntity,
        calculateTaskProgress,
        moveSubtask,
        deleteSubtask,
        canHaveSubtasks,
        ENTITY_TYPES 
    } = window.entityCore;
    
    try {
        // 1. Create a parent task
        console.log('\n1. Creating parent task...');
        const parentTask = await createEntity(ENTITY_TYPES.TASK, {
            title: 'Implement User Authentication',
            content: 'Complete user authentication system with all features',
            priority: 'high'
        });
        console.log('✅ Parent task created:', parentTask.id);
        
        // 2. Add subtasks
        console.log('\n2. Adding subtasks...');
        const subtask1 = await addSubtask(parentTask.id, {
            title: 'Create login form',
            content: 'Design and implement the login UI',
            priority: 'medium'
        });
        console.log('✅ Subtask 1 created:', subtask1.id);
        
        const subtask2 = await addSubtask(parentTask.id, {
            title: 'Add password validation',
            content: 'Implement secure password requirements',
            priority: 'high'
        });
        console.log('✅ Subtask 2 created:', subtask2.id);
        
        const subtask3 = await addSubtask(parentTask.id, {
            title: 'Implement 2FA',
            content: 'Add two-factor authentication support',
            priority: 'medium'
        });
        console.log('✅ Subtask 3 created:', subtask3.id);
        
        // 3. Test getSubtasks
        console.log('\n3. Getting subtasks...');
        const subtasks = await getSubtasks(parentTask.id);
        console.log('✅ Found', subtasks.length, 'subtasks:', subtasks.map(st => st.title));
        
        // 4. Test getParentEntity
        console.log('\n4. Getting parent entity...');
        const parent = await getParentEntity(subtask1.id);
        console.log('✅ Parent of subtask 1:', parent?.title);
        
        // 5. Test canHaveSubtasks
        console.log('\n5. Testing canHaveSubtasks...');
        console.log('Task can have subtasks:', canHaveSubtasks(parentTask));
        console.log('Note can have subtasks:', canHaveSubtasks({ type: ENTITY_TYPES.NOTE }));
        
        // 6. Test progress calculation
        console.log('\n6. Testing progress calculation...');
        let progress = await calculateTaskProgress(parentTask);
        console.log('Initial progress (0 completed):', progress + '%');
        
        // Mark first subtask as complete
        await window.entityCore.updateEntity(subtask1.id, { completed: true });
        progress = await calculateTaskProgress(parentTask);
        console.log('Progress with 1/3 completed:', progress + '%');
        
        // 7. Test creating a project with subtasks
        console.log('\n7. Creating project with subtasks...');
        const project = await createEntity(ENTITY_TYPES.PROJECT, {
            title: 'Q1 Product Launch',
            content: 'Launch new product features in Q1',
            status: 'in-progress'
        });
        
        const projectSubtask = await addSubtask(project.id, {
            title: 'Market research',
            content: 'Analyze competitor features'
        });
        console.log('✅ Project created with subtask:', project.id, projectSubtask.id);
        
        // 8. Test moving subtask
        console.log('\n8. Testing moveSubtask...');
        await moveSubtask(subtask3.id, project.id);
        const movedParent = await getParentEntity(subtask3.id);
        console.log('✅ Subtask 3 moved to:', movedParent?.title);
        
        // 9. Test making subtask independent
        console.log('\n9. Making subtask independent...');
        await moveSubtask(subtask2.id, null);
        const independentParent = await getParentEntity(subtask2.id);
        console.log('✅ Subtask 2 is now independent, parent:', independentParent);
        
        // 10. Test cleanup
        console.log('\n10. Cleaning up test data...');
        await deleteSubtask(subtask1.id);
        await deleteSubtask(subtask2.id);
        await deleteSubtask(subtask3.id);
        await deleteSubtask(projectSubtask.id);
        await window.entityCore.deleteEntity(parentTask.id);
        await window.entityCore.deleteEntity(project.id);
        console.log('✅ Test data cleaned up');
        
        console.log('\n=== ALL TESTS PASSED ===');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testSubtaskSystem();
pipeline {
    agent any

    environment {
        FRONTEND_IMAGE = "system-monitor-frontend:${env.BUILD_ID}"
        BACKEND_IMAGE = "system-monitor-backend:${env.BUILD_ID}"
        FRONTEND_CONTAINER = "system-monitor-frontend"
        BACKEND_CONTAINER = "system-monitor-backend"
    }

    stages {
        stage('Clean Existing Containers') {
            steps {
                sh '''
                echo "=== Cleaning up existing containers ==="
                docker stop ${FRONTEND_CONTAINER} ${BACKEND_CONTAINER} || true
                docker rm ${FRONTEND_CONTAINER} ${BACKEND_CONTAINER} || true
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh """
                echo "=== Building backend image ==="
                cd backend
                docker build -t ${BACKEND_IMAGE} .
                
                echo "=== Building frontend image ==="
                cd ../frontend
                docker build -t ${FRONTEND_IMAGE} .
                """
            }
        }

        stage('Run Backend with Debug') {
            steps {
                sh """
                echo "=== Starting backend container ==="
                # Run in foreground first to see any immediate errors
                docker run -d \\
                  -p 3000:3000 \\
                  --name ${BACKEND_CONTAINER} \\
                  ${BACKEND_IMAGE}
                
                echo "Waiting a moment for backend to start..."
                sleep 10
                
                # Check if container is running
                echo "Container status:"
                docker ps -a --filter "name=${BACKEND_CONTAINER}"
                
                # Check logs for errors
                echo "Backend logs:"
                docker logs ${BACKEND_CONTAINER} || true
                
                # Check if port is listening
                echo "Port check:"
                netstat -tuln | grep :3000 || echo "Port 3000 not listening"
                """
            }
        }

        stage('Verify Backend') {
            steps {
                sh """
                echo "=== Testing backend ==="
                # Try to connect to backend
                if curl -f http://localhost:3000/api/cpu; then
                    echo "✅ Backend is working!"
                else
                    echo "❌ Backend failed - checking details..."
                    docker logs ${BACKEND_CONTAINER}
                    exit 1
                fi
                """
            }
        }

        stage('Run Frontend') {
            steps {
                sh """
                echo "=== Starting frontend container ==="
                docker run -d \\
                  -p 3001:80 \\
                  --name ${FRONTEND_CONTAINER} \\
                  ${FRONTEND_IMAGE}
                
                sleep 5
                echo "Frontend container status:"
                docker ps -a --filter "name=${FRONTEND_CONTAINER}"
                """
            }
        }

        stage('Final Verification') {
            steps {
                sh """
                echo "=== Final verification ==="
                echo "Testing backend..."
                curl -f http://localhost:3000/api/cpu
                
                echo "Testing frontend..."
                curl -f http://localhost:3001
                
                echo "✅ All services are running successfully!"
                """
            }
        }
    }

    post {
        always {
            sh '''
            echo "=== Final container status ==="
            docker ps -a
            '''
            cleanWs()
        }
        failure {
            sh '''
            echo "=== FAILURE DEBUG INFO ==="
            echo "All containers:"
            docker ps -a
            echo ""
            echo "Backend logs:"
            docker logs ${BACKEND_CONTAINER} || true
            echo ""
            echo "Frontend logs:"
            docker logs ${FRONTEND_CONTAINER} || true
            echo ""
            echo "Network status:"
            netstat -tuln | grep -E "(3000|3001)" || true
            '''
        }
    }
}
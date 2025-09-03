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
                # Stop and remove any existing containers
                echo "Cleaning up any existing containers..."
                docker stop ${FRONTEND_CONTAINER} ${BACKEND_CONTAINER} || true
                docker rm ${FRONTEND_CONTAINER} ${BACKEND_CONTAINER} || true
                
                # Additional cleanup for any orphaned containers
                docker ps -a --filter "name=system-monitor" --format "{{.ID}}" | xargs -r docker stop || true
                docker ps -a --filter "name=system-monitor" --format "{{.ID}}" | xargs -r docker rm || true
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh """
                echo "Building frontend image..."
                cd frontend
                docker build -t ${FRONTEND_IMAGE} .
                """
            }
        }

        stage('Build Backend Image') {
            steps {
                sh """
                echo "Building backend image..."
                cd backend
                docker build -t ${BACKEND_IMAGE} .
                """
            }
        }

        stage('Run Backend Container') {
            steps {
                sh """
                echo "Starting backend container..."
                docker run -d \\
                  -p 3000:3000 \\
                  --name ${BACKEND_CONTAINER} \\
                  --restart unless-stopped \\
                  ${BACKEND_IMAGE}
                """
            }
        }

        stage('Run Frontend Container') {
            steps {
                sh """
                echo "Starting frontend container..."
                docker run -d \\
                  -p 3001:80 \\
                  --name ${FRONTEND_CONTAINER} \\
                  --restart unless-stopped \\
                  ${FRONTEND_IMAGE}
                """
            }
        }

        stage('Verify Deployment') {
            steps {
                sh """
                echo "Waiting for services to start..."
                sleep 20
                
                echo "Testing backend API..."
                curl --retry 5 --retry-delay 5 --max-time 10 -f http://localhost:3000/api/cpu
                
                echo "Testing frontend..."
                curl --retry 3 --retry-delay 3 --max-time 10 -f http://localhost:3001
                
                echo "✅ Deployment successful! All services are running."
                """
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "Build ${env.BUILD_ID} succeeded! 🎉"
            sh '''
            echo "=== Deployment Summary ==="
            echo "Frontend: http://localhost:3001"
            echo "Backend API: http://localhost:3000/api/cpu"
            docker ps --filter "name=system-monitor" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
            '''
        }
        failure {
            echo "Build ${env.BUILD_ID} failed! ❌"
            sh '''
            echo "=== Debug Information ==="
            echo "Running containers:"
            docker ps -a
            echo ""
            echo "Port 3000 status:"
            netstat -tuln | grep :3000 || echo "Port 3000 not listening"
            echo ""
            echo "Port 3001 status:"
            netstat -tuln | grep :3001 || echo "Port 3001 not listening"
            echo ""
            echo "Container logs (if any):"
            docker logs ${BACKEND_CONTAINER} || echo "No backend logs"
            docker logs ${FRONTEND_CONTAINER} || echo "No frontend logs"
            '''
        }
    }
}
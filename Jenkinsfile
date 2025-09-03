pipeline {
    agent any

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Stop Existing Containers') {
            steps {
                sh '''
                # Stop and remove any containers from this project
                docker-compose down || true
                
                # Ensure ports are free by removing any conflicting containers
                docker stop system-monitor-backend system-monitor-frontend || true
                docker rm system-monitor-backend system-monitor-frontend || true
                '''
            }
        }

        stage('Build and Deploy with Docker Compose') {
            steps {
                sh '''
                # Build and start all services
                docker-compose up -d --build
                
                # Wait for services to start
                sleep 15
                
                # Verify backend is running
                echo "Testing backend API..."
                curl -f http://localhost:3000/api/cpu || exit 1
                
                # Verify frontend is running
                echo "Testing frontend..."
                curl -f http://localhost:3001 || exit 1
                
                echo "✅ Deployment successful!"
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                # Double check everything is running
                docker-compose ps
                docker-compose logs --tail=10
                '''
            }
        }
    }

    post {
        always {
            echo "Pipeline execution completed"
            cleanWs()
        }
        success {
            echo "Build ${env.BUILD_ID} succeeded! 🎉"
            sh '''
            echo "Frontend: http://localhost:3001"
            echo "Backend API: http://localhost:3000/api/cpu"
            '''
        }
        failure {
            echo "Build ${env.BUILD_ID} failed! ❌"
            sh 'docker-compose logs || true'
        }
    }
}
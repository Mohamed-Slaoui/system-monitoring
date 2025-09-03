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
                echo "🔄 Stopping and removing old containers..."
                docker stop ${FRONTEND_CONTAINER} ${BACKEND_CONTAINER} || true
                docker rm ${FRONTEND_CONTAINER} ${BACKEND_CONTAINER} || true
                echo "✅ Cleanup completed"
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh """
                echo "🏗️ Building backend image..."
                cd backend
                docker build -t ${BACKEND_IMAGE} .
                
                echo "🏗️ Building frontend image..."
                cd ../frontend
                docker build -t ${FRONTEND_IMAGE} .
                """
            }
        }

        stage('Run Containers') {
            steps {
                sh """
                echo "🚀 Starting backend container..."
                docker run -d \\
                  -p 3000:3000 \\
                  --name ${BACKEND_CONTAINER} \\
                  --restart unless-stopped \\
                  ${BACKEND_IMAGE}

                echo "🚀 Starting frontend container..."
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
                echo "🔍 Testing deployment..."
                sleep 15
                
                echo "Testing backend API..."
                curl -f http://localhost:3000/api/cpu && echo "✅ Backend working!"
                
                echo "Testing frontend..."
                curl -f http://localhost:3001 && echo "✅ Frontend working!"
                
                echo "🎉 Deployment successful! All systems operational."
                """
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "✅ Build ${env.BUILD_ID} succeeded! GitHub push → Auto-deployment complete! 🚀"
        }
        failure {
            echo "❌ Build ${env.BUILD_ID} failed! Check logs above."
            sh '''
            echo "📋 Debug info:"
            docker ps -a
            docker logs ${BACKEND_CONTAINER} || true
            docker logs ${FRONTEND_CONTAINER} || true
            '''
        }
    }
}
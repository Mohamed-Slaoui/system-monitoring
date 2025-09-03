pipeline {
    agent any

    environment {
        FRONTEND_IMAGE = "system-monitor-frontend:${env.BUILD_ID}"
        BACKEND_IMAGE = "system-monitor-backend:${env.BUILD_ID}"
        FRONTEND_CONTAINER = "system-monitor-frontend"
        BACKEND_CONTAINER = "system-monitor-backend"
        NETWORK_NAME = "app-network"
    }

    stages {
        stage('Create Network') {
            steps {
                sh """
                docker network create ${NETWORK_NAME} || true
                """
            }
        }

        stage('Clean Existing Containers') {
            steps {
                sh '''
                docker stop ${FRONTEND_CONTAINER} ${BACKEND_CONTAINER} || true
                docker rm ${FRONTEND_CONTAINER} ${BACKEND_CONTAINER} || true
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh """
                cd backend && docker build -t ${BACKEND_IMAGE} .
                cd ../frontend && docker build -t ${FRONTEND_IMAGE} .
                """
            }
        }

        stage('Run Backend') {
            steps {
                sh """
                docker run -d \\
                  -p 3000:3000 \\
                  --name ${BACKEND_CONTAINER} \\
                  --network ${NETWORK_NAME} \\
                  ${BACKEND_IMAGE}
                """
            }
        }

        stage('Run Frontend') {
            steps {
                sh """
                docker run -d \\
                  -p 3001:80 \\
                  --name ${FRONTEND_CONTAINER} \\
                  --network ${NETWORK_NAME} \\
                  ${FRONTEND_IMAGE}
                """
            }
        }

        stage('Verify Deployment') {
            steps {
                sh """
                sleep 10
                curl -f http://localhost:3000/api/cpu
                curl -f http://localhost:3001
                echo "✅ All services working!"
                """
            }
        }
    }
}
pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'localhost:5000' // Change if using a registry
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/system-monitor-frontend:${env.BUILD_ID}"
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/system-monitor-backend:${env.BUILD_ID}"
    }
    
    stages {
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    script {
                        docker.build("${FRONTEND_IMAGE}", "--build-arg VITE_API_BASE=/api .")
                    }
                }
            }
        }
        
        stage('Build Backend') {
            steps {
                dir('backend') {
                    script {
                        docker.build("${BACKEND_IMAGE}", ".")
                    }
                }
            }
        }
        
        stage('Test Applications') {
            steps {
                // Add your test commands here
                echo 'Running tests...'
                // sh 'npm test' // Uncomment if you have tests
            }
        }
        
        stage('Push Images') {
            steps {
                script {
                    docker.push("${FRONTEND_IMAGE}")
                    docker.push("${BACKEND_IMAGE}")
                }
            }
        }
        
        stage('Deploy to Production') {
            steps {
                script {
                    // Stop and remove old containers
                    sh 'docker-compose down || true'
                    
                    // Pull latest images
                    sh "docker pull ${FRONTEND_IMAGE}"
                    sh "docker pull ${BACKEND_IMAGE}"
                    
                    // Update docker-compose with new images
                    sh "sed -i 's|image:.*frontend.*|image: ${FRONTEND_IMAGE}|' docker-compose.yml"
                    sh "sed -i 's|image:.*backend.*|image: ${BACKEND_IMAGE}|' docker-compose.yml"
                    
                    // Start new containers
                    sh 'docker-compose up -d'
                }
            }
        }
    }
    
    post {
        always {
            // Clean up workspace
            cleanWs()
        }
        success {
            slackSend(message: "Build ${env.BUILD_ID} succeeded! 🎉")
        }
        failure {
            slackSend(message: "Build ${env.BUILD_ID} failed! 😞")
        }
    }
}
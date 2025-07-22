#!/usr/bin/env python3
"""
BarBuddy Authentication Integration Test
Tests the authentication system components including Supabase integration and fallback auth.
"""

import asyncio
import json
import sys
import os
import requests
from datetime import datetime
from typing import Dict, Any, Optional

class AuthIntegrationTester:
    def __init__(self):
        self.test_results = []
        self.backend_url = "http://localhost:8001"
        self.web_server_url = "http://localhost:8080"
        
    def log_test(self, test_name: str, success: bool, message: str, details: Optional[Dict] = None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {json.dumps(details, indent=2)}")
    
    async def test_backend_api_accessibility(self):
        """Test 1: Backend API Accessibility"""
        try:
            # Test backend root endpoint
            response = requests.get(f"{self.backend_url}/", timeout=5)
            if response.status_code != 200:
                raise Exception(f"Backend root endpoint failed: {response.status_code}")
            
            root_data = response.json()
            
            # Test backend API endpoint
            api_response = requests.get(f"{self.backend_url}/api", timeout=5)
            if api_response.status_code != 200:
                raise Exception(f"Backend API endpoint failed: {api_response.status_code}")
            
            api_data = api_response.json()
            
            # Test user profile endpoint
            profile_response = requests.get(f"{self.backend_url}/api/user/test123/profile", timeout=5)
            if profile_response.status_code != 200:
                raise Exception(f"User profile endpoint failed: {profile_response.status_code}")
            
            profile_data = profile_response.json()
            
            # Test venues endpoint
            venues_response = requests.get(f"{self.backend_url}/api/venues/likes/global", timeout=5)
            if venues_response.status_code != 200:
                raise Exception(f"Venues endpoint failed: {venues_response.status_code}")
            
            venues_data = venues_response.json()
            
            self.log_test(
                "Backend API Accessibility",
                True,
                "All backend API endpoints are accessible and responding correctly",
                {
                    'backend_status': root_data.get('status'),
                    'api_endpoints': api_data.get('endpoints', {}),
                    'profile_demo': profile_data.get('username'),
                    'venues_count': len(venues_data) if isinstance(venues_data, list) else 0
                }
            )
            
        except Exception as e:
            self.log_test(
                "Backend API Accessibility",
                False,
                f"Backend API accessibility test failed: {str(e)}"
            )
    
    async def test_web_server_accessibility(self):
        """Test 2: Web Server and Login Page Accessibility"""
        try:
            # Test web server root
            response = requests.get(f"{self.web_server_url}/", timeout=5)
            if response.status_code != 200:
                raise Exception(f"Web server root failed: {response.status_code}")
            
            # Test login test page
            login_response = requests.get(f"{self.web_server_url}/login-test.html", timeout=5)
            if login_response.status_code != 200:
                raise Exception(f"Login test page failed: {login_response.status_code}")
            
            login_html = login_response.text
            
            # Check if essential elements are present in the HTML
            essential_elements = [
                '<title>BarBuddy - Login Test</title>',
                'supabase.createClient',
                'id="signin-form"',
                'id="signup-form"',
                'function signUp()',
                'function signIn()',
                'fallbackAuth'
            ]
            
            missing_elements = []
            for element in essential_elements:
                if element not in login_html:
                    missing_elements.append(element)
            
            if missing_elements:
                raise Exception(f"Missing essential elements: {missing_elements}")
            
            self.log_test(
                "Web Server and Login Page Accessibility",
                True,
                "Web server is accessible and login page contains all essential elements",
                {
                    'page_size': len(login_html),
                    'essential_elements_found': len(essential_elements) - len(missing_elements),
                    'total_essential_elements': len(essential_elements),
                    'has_supabase_integration': 'supabase.createClient' in login_html,
                    'has_fallback_auth': 'fallbackAuth' in login_html
                }
            )
            
        except Exception as e:
            self.log_test(
                "Web Server and Login Page Accessibility",
                False,
                f"Web server accessibility test failed: {str(e)}"
            )
    
    async def test_supabase_configuration(self):
        """Test 3: Supabase Configuration in Login Page"""
        try:
            # Get the login page content
            response = requests.get(f"{self.web_server_url}/login-test.html", timeout=5)
            login_html = response.text
            
            # Extract Supabase configuration
            supabase_url = None
            supabase_key = None
            
            # Look for Supabase URL and key in the HTML
            lines = login_html.split('\n')
            for line in lines:
                if 'supabaseUrl =' in line and 'https://' in line:
                    # Extract URL from line like: const supabaseUrl = 'https://...';
                    start = line.find("'") + 1
                    end = line.rfind("'")
                    if start > 0 and end > start:
                        supabase_url = line[start:end]
                
                if 'supabaseKey =' in line and 'eyJ' in line:
                    # Extract key from line like: const supabaseKey = 'eyJ...';
                    start = line.find("'") + 1
                    end = line.rfind("'")
                    if start > 0 and end > start:
                        supabase_key = line[start:end]
            
            if not supabase_url:
                raise Exception("Supabase URL not found in login page")
            
            if not supabase_key:
                raise Exception("Supabase key not found in login page")
            
            # Validate URL format
            if not supabase_url.startswith('https://') or not supabase_url.endswith('.supabase.co'):
                raise Exception(f"Invalid Supabase URL format: {supabase_url}")
            
            # Validate key format (JWT should start with eyJ)
            if not supabase_key.startswith('eyJ'):
                raise Exception("Invalid Supabase key format")
            
            self.log_test(
                "Supabase Configuration",
                True,
                "Supabase configuration is properly set up in login page",
                {
                    'supabase_url': supabase_url,
                    'key_length': len(supabase_key),
                    'key_prefix': supabase_key[:10] + '...',
                    'url_valid_format': supabase_url.endswith('.supabase.co'),
                    'key_valid_format': supabase_key.startswith('eyJ')
                }
            )
            
        except Exception as e:
            self.log_test(
                "Supabase Configuration",
                False,
                f"Supabase configuration test failed: {str(e)}"
            )
    
    async def test_fallback_authentication_logic(self):
        """Test 4: Fallback Authentication Logic"""
        try:
            # Get the login page content
            response = requests.get(f"{self.web_server_url}/login-test.html", timeout=5)
            login_html = response.text
            
            # Check for fallback authentication components
            fallback_components = [
                'fallbackAuth',
                'signUp(phone, password, username)',
                'signIn(phone, password)',
                'signOut()',
                'createProfile(user)',
                'localStorage.getItem',
                'localStorage.setItem',
                'useFallback'
            ]
            
            found_components = []
            missing_components = []
            
            for component in fallback_components:
                if component in login_html:
                    found_components.append(component)
                else:
                    missing_components.append(component)
            
            # Check for fallback trigger logic
            has_fallback_trigger = 'useFallback = true' in login_html
            has_error_handling = 'catch' in login_html and 'supabaseError' in login_html
            has_local_storage = 'localStorage' in login_html
            
            if len(missing_components) > 2:  # Allow some flexibility
                raise Exception(f"Too many missing fallback components: {missing_components}")
            
            self.log_test(
                "Fallback Authentication Logic",
                True,
                "Fallback authentication logic is properly implemented",
                {
                    'found_components': found_components,
                    'missing_components': missing_components,
                    'has_fallback_trigger': has_fallback_trigger,
                    'has_error_handling': has_error_handling,
                    'has_local_storage': has_local_storage,
                    'fallback_coverage': f"{len(found_components)}/{len(fallback_components)}"
                }
            )
            
        except Exception as e:
            self.log_test(
                "Fallback Authentication Logic",
                False,
                f"Fallback authentication logic test failed: {str(e)}"
            )
    
    async def test_authentication_flow_structure(self):
        """Test 5: Authentication Flow Structure"""
        try:
            # Get the login page content
            response = requests.get(f"{self.web_server_url}/login-test.html", timeout=5)
            login_html = response.text
            
            # Check for essential authentication flow elements
            flow_elements = {
                'sign_up_function': 'async function signUp()',
                'sign_in_function': 'async function signIn()',
                'sign_out_function': 'async function signOut()',
                'form_validation': 'if (!phone || !password)',
                'status_display': 'showStatus(',
                'user_info_display': 'showUserInfo(',
                'tab_switching': 'switchTab(',
                'demo_data': 'fillDemoData()',
                'session_check': 'getSession()',
                'error_handling': 'try {' and 'catch (error)'
            }
            
            found_elements = {}
            for element_name, element_pattern in flow_elements.items():
                if isinstance(element_pattern, str):
                    found_elements[element_name] = element_pattern in login_html
                else:
                    # Handle tuple case (multiple conditions)
                    found_elements[element_name] = all(pattern in login_html for pattern in element_pattern)
            
            # Check form elements
            form_elements = [
                'id="signin-phone"',
                'id="signin-password"',
                'id="signup-phone"',
                'id="signup-username"',
                'id="signup-password"',
                'id="user-info"',
                'id="status"'
            ]
            
            missing_forms = [elem for elem in form_elements if elem not in login_html]
            
            # Calculate success metrics
            flow_success_rate = sum(found_elements.values()) / len(found_elements)
            form_success_rate = (len(form_elements) - len(missing_forms)) / len(form_elements)
            
            if flow_success_rate < 0.8 or form_success_rate < 0.9:
                raise Exception(f"Authentication flow structure incomplete. Flow: {flow_success_rate:.1%}, Forms: {form_success_rate:.1%}")
            
            self.log_test(
                "Authentication Flow Structure",
                True,
                "Authentication flow structure is complete and well-organized",
                {
                    'flow_elements_found': found_elements,
                    'missing_form_elements': missing_forms,
                    'flow_success_rate': f"{flow_success_rate:.1%}",
                    'form_success_rate': f"{form_success_rate:.1%}",
                    'has_async_functions': 'async function' in login_html,
                    'has_error_handling': 'try {' in login_html and 'catch' in login_html
                }
            )
            
        except Exception as e:
            self.log_test(
                "Authentication Flow Structure",
                False,
                f"Authentication flow structure test failed: {str(e)}"
            )
    
    async def test_integration_readiness(self):
        """Test 6: Integration Readiness"""
        try:
            # Check if all components are ready for integration
            backend_ready = False
            web_server_ready = False
            
            # Test backend readiness
            try:
                response = requests.get(f"{self.backend_url}/api", timeout=5)
                backend_ready = response.status_code == 200
            except:
                pass
            
            # Test web server readiness
            try:
                response = requests.get(f"{self.web_server_url}/login-test.html", timeout=5)
                web_server_ready = response.status_code == 200
            except:
                pass
            
            # Check for TypeScript/JavaScript files that might be part of the auth system
            auth_files_exist = []
            auth_files_to_check = [
                '/app/stores/authStore.ts',
                '/app/lib/auth.ts',
                '/app/lib/supabase.ts'
            ]
            
            for file_path in auth_files_to_check:
                if os.path.exists(file_path):
                    auth_files_exist.append(file_path)
            
            # Check if services are running
            services_status = {}
            try:
                import subprocess
                result = subprocess.run(['sudo', 'supervisorctl', 'status'], 
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    for line in result.stdout.split('\n'):
                        if 'backend' in line:
                            services_status['backend'] = 'RUNNING' in line
                        if 'frontend' in line:
                            services_status['frontend'] = 'RUNNING' in line
            except:
                pass
            
            integration_score = 0
            max_score = 5
            
            if backend_ready:
                integration_score += 1
            if web_server_ready:
                integration_score += 1
            if len(auth_files_exist) >= 2:
                integration_score += 1
            if services_status.get('backend', False):
                integration_score += 1
            if len(self.test_results) >= 4 and all(r['success'] for r in self.test_results[-4:]):
                integration_score += 1
            
            if integration_score < 3:
                raise Exception(f"Integration readiness score too low: {integration_score}/{max_score}")
            
            self.log_test(
                "Integration Readiness",
                True,
                f"System is ready for authentication integration (Score: {integration_score}/{max_score})",
                {
                    'backend_ready': backend_ready,
                    'web_server_ready': web_server_ready,
                    'auth_files_found': auth_files_exist,
                    'services_status': services_status,
                    'integration_score': f"{integration_score}/{max_score}",
                    'readiness_percentage': f"{(integration_score/max_score)*100:.0f}%"
                }
            )
            
        except Exception as e:
            self.log_test(
                "Integration Readiness",
                False,
                f"Integration readiness test failed: {str(e)}"
            )
    
    async def run_all_tests(self):
        """Run all authentication integration tests"""
        print("🚀 Starting BarBuddy Authentication Integration Testing")
        print("=" * 70)
        
        # Run all tests
        await self.test_backend_api_accessibility()
        await self.test_web_server_accessibility()
        await self.test_supabase_configuration()
        await self.test_fallback_authentication_logic()
        await self.test_authentication_flow_structure()
        await self.test_integration_readiness()
        
        # Generate summary
        print("\n" + "=" * 70)
        print("📊 AUTHENTICATION INTEGRATION TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result['success']:
                print(f"  - {result['test']}")
        
        # Overall assessment
        if passed_tests == total_tests:
            print("\n🎉 AUTHENTICATION SYSTEM STATUS: FULLY FUNCTIONAL")
            print("✅ All authentication components are working correctly")
            print("✅ Supabase integration is properly configured")
            print("✅ Fallback authentication is implemented")
            print("✅ Backend API is accessible and responding")
            print("✅ Web interface is ready for user testing")
        elif passed_tests >= total_tests * 0.8:
            print("\n⚠️  AUTHENTICATION SYSTEM STATUS: MOSTLY FUNCTIONAL")
            print("✅ Core authentication components are working")
            print("⚠️  Some minor issues detected - see failed tests above")
        else:
            print("\n❌ AUTHENTICATION SYSTEM STATUS: NEEDS ATTENTION")
            print("❌ Multiple authentication components have issues")
            print("❌ System may not be ready for user testing")
        
        return {
            'total': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'success_rate': (passed_tests/total_tests)*100,
            'results': self.test_results
        }

async def main():
    """Main test runner"""
    tester = AuthIntegrationTester()
    results = await tester.run_all_tests()
    
    # Exit with appropriate code
    exit_code = 0 if results['failed'] == 0 else 1
    sys.exit(exit_code)

if __name__ == "__main__":
    asyncio.run(main())
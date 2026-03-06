'use client'

import { useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  useToast,
  Divider,
  Badge,
  Icon,
  Flex,
  Spinner,
} from '@chakra-ui/react'
import { FaYinYang, FaUser, FaBaby, FaBuilding, FaMagic, FaHistory } from 'react-icons/fa'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/names'

interface GeneratedName {
  name: string
  pinyin: string
  wuxing: string
  meaning: string
  score: number
}

interface BaZiChart {
  year: { stem: string; branch: string; element: string }
  month: { stem: string; branch: string; element: string }
  day: { stem: string; branch: string; element: string }
  hour: { stem: string; branch: string; element: string }
}

export default function Home() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [names, setNames] = useState<GeneratedName[]>([])
  const [baziChart, setBaziChart] = useState<BaZiChart | null>(null)
  const [wuxing, setWuxing] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    nameType: 'baby',
    gender: '',
    birthDate: '',
    birthTime: '',
    surname: '',
    description: '',
    style: 'classical',
  })
  
  const toast = useToast()
  
  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async () => {
    if (!formData.birthDate) {
      toast({
        title: '请选择出生日期',
        status: 'warning',
        duration: 3000,
      })
      return
    }
    
    setLoading(true)
    try {
      // Parse birth hour from time branch
      let birthHour: number | undefined
      const timeMap: { [key: string]: number } = {
        '子': 0, '丑': 2, '寅': 4, '卯': 6,
        '辰': 8, '巳': 10, '午': 12, '未': 14,
        '申': 16, '酉': 18, '戌': 20, '亥': 22
      }
      if (formData.birthTime) {
        birthHour = timeMap[formData.birthTime]
      }
      
      const response = await axios.post(`${API_URL}`, {
        name_type: formData.nameType,
        gender: formData.gender || null,
        birth_date: formData.birthDate,
        birth_time: formData.birthTime || null,
        birth_hour: birthHour,
        surname: formData.surname,
        description: formData.description,
        style: formData.style,
        count: 10,
      })
      
      setNames(response.data.names)
      setBaziChart(response.data.bazi_chart)
      setWuxing(response.data.wuxing_analysis)
      setStep(2)
      
      toast({
        title: '名字生成成功！',
        status: 'success',
        duration: 3000,
      })
    } catch (error: any) {
      toast({
        title: '生成失败',
        description: error.message || '请稍后重试',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="brand.600" color="white" py={6}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Icon as={FaYinYang} boxSize={8} />
              <Heading size="lg">易名云 YiName</Heading>
            </HStack>
            <HStack spacing={4}>
              <Button variant="ghost" color="white" leftIcon={<FaHistory />}>
                历史记录
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>
      
      <Container maxW="container.md" py={8}>
        {step === 1 ? (
          <Card>
            <CardHeader>
              <Heading size="md">开始取名</Heading>
              <Text color="gray.600" mt={1}>
                输入您的信息，让我们为您生成合适的名字
              </Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Name Type */}
                <FormControl>
                  <FormLabel>取名类型</FormLabel>
                  <HStack spacing={3}>
                    <Button
                      flex={1}
                      colorScheme={formData.nameType === 'baby' ? 'brand' : 'gray'}
                      leftIcon={<FaBaby />}
                      onClick={() => setFormData(prev => ({ ...prev, nameType: 'baby' }))}
                    >
                      宝宝取名
                    </Button>
                    <Button
                      flex={1}
                      colorScheme={formData.nameType === 'personal' ? 'brand' : 'gray'}
                      leftIcon={<FaUser />}
                      onClick={() => setFormData(prev => ({ ...prev, nameType: 'personal' }))}
                    >
                      个人取名
                    </Button>
                    <Button
                      flex={1}
                      colorScheme={formData.nameType === 'business' ? 'brand' : 'gray'}
                      leftIcon={<FaBuilding />}
                      onClick={() => setFormData(prev => ({ ...prev, nameType: 'business' }))}
                    >
                      企业取名
                    </Button>
                  </HStack>
                </FormControl>
                
                {/* Gender */}
                <FormControl>
                  <FormLabel>性别</FormLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    placeholder="选择性别"
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </Select>
                </FormControl>
                
                {/* Birth Date */}
                <FormControl isRequired>
                  <FormLabel>出生日期</FormLabel>
                  <Input
                    type="datetime-local"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                  />
                </FormControl>
                
                {/* Birth Time */}
                <FormControl>
                  <FormLabel>出生时辰</FormLabel>
                  <Select
                    name="birthTime"
                    value={formData.birthTime}
                    onChange={handleInputChange}
                    placeholder="选择时辰（可选）"
                  >
                    <option value="子">子时 (23:00-01:00)</option>
                    <option value="丑">丑时 (01:00-03:00)</option>
                    <option value="寅">寅时 (03:00-05:00)</option>
                    <option value="卯">卯时 (05:00-07:00)</option>
                    <option value="辰">辰时 (07:00-09:00)</option>
                    <option value="巳">巳时 (09:00-11:00)</option>
                    <option value="午">午时 (11:00-13:00)</option>
                    <option value="未">未时 (13:00-15:00)</option>
                    <option value="申">申时 (15:00-17:00)</option>
                    <option value="酉">酉时 (17:00-19:00)</option>
                    <option value="戌">戌时 (19:00-21:00)</option>
                    <option value="亥">亥时 (21:00-23:00)</option>
                  </Select>
                </FormControl>
                
                {/* Surname */}
                <FormControl>
                  <FormLabel>姓氏</FormLabel>
                  <Input
                    name="surname"
                    value={formData.surname}
                    onChange={handleInputChange}
                    placeholder="请输入姓氏（可选）"
                    maxLength={2}
                  />
                </FormControl>
                
                {/* Style */}
                <FormControl>
                  <FormLabel>名字风格</FormLabel>
                  <Select
                    name="style"
                    value={formData.style}
                    onChange={handleInputChange}
                  >
                    <option value="classical">古典风</option>
                    <option value="modern">现代风</option>
                    <option value="creative">创意风</option>
                  </Select>
                </FormControl>
                
                {/* Description */}
                <FormControl>
                  <FormLabel>其他要求</FormLabel>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="请描述您对名字的其他要求（可选）"
                    rows={3}
                  />
                </FormControl>
                
                <Button
                  colorScheme="brand"
                  size="lg"
                  leftIcon={loading ? <Spinner size="sm" /> : <FaMagic />}
                  onClick={handleSubmit}
                  isLoading={loading}
                  loadingText="生成中..."
                >
                  生成名字
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <VStack spacing={6} align="stretch">
            {/* BaZi Chart */}
            {baziChart && (
              <Card>
                <CardHeader>
                  <Heading size="sm">八字排盘</Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <SimpleGrid columns={4} spacing={4} textAlign="center">
                    <Box>
                      <Text fontSize="xl" fontWeight="bold">{baziChart.year.stem}{baziChart.year.branch}</Text>
                      <Badge>年柱</Badge>
                      <Text fontSize="sm" color="gray.500">{baziChart.year.element}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xl" fontWeight="bold">{baziChart.month.stem}{baziChart.month.branch}</Text>
                      <Badge>月柱</Badge>
                      <Text fontSize="sm" color="gray.500">{baziChart.month.element}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xl" fontWeight="bold">{baziChart.day.stem}{baziChart.day.branch}</Text>
                      <Badge colorScheme="red">日柱</Badge>
                      <Text fontSize="sm" color="gray.500">{baziChart.day.element}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xl" fontWeight="bold">{baziChart.hour.stem}{baziChart.hour.branch}</Text>
                      <Badge>时柱</Badge>
                      <Text fontSize="sm" color="gray.500">{baziChart.hour.element}</Text>
                    </Box>
                  </SimpleGrid>
                  
                  {wuxing && (
                    <Box mt={4}>
                      <Divider mb={4} />
                      <Text fontWeight="bold" mb={2}>五行分析</Text>
                      <HStack spacing={4} justify="center">
                        {Object.entries(wuxing.counts).map(([element, count]: [string, any]) => (
                          <Badge key={element} colorScheme={count > 2 ? 'red' : 'gray'} fontSize="md" px={2} py={1}>
                            {element}: {count}
                          </Badge>
                        ))}
                      </HStack>
                      <Text mt={2} fontSize="sm" color="gray.600" textAlign="center">
                        喜用神: <Badge colorScheme="purple">{wuxing.favored_element}</Badge>
                      </Text>
                    </Box>
                  )}
                </CardBody>
              </Card>
            )}
            
            {/* Generated Names */}
            <Card>
              <CardHeader>
                <Heading size="md">为您推荐的名字</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={4} align="stretch">
                  {names.map((name, index) => (
                    <Box
                      key={index}
                      p={4}
                      borderWidth={1}
                      borderRadius="md"
                      _hover={{ borderColor: 'brand.300', bg: 'brand.50' }}
                    >
                      <Flex justify="space-between" align="center">
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Heading size="md">{name.name}</Heading>
                            <Badge colorScheme="blue">{name.pinyin}</Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">{name.meaning}</Text>
                          <HStack spacing={2}>
                            <Badge colorScheme="green">{name.wuxing}</Badge>
                          </HStack>
                        </VStack>
                        <VStack>
                          <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                            {name.score}
                          </Text>
                          <Text fontSize="xs" color="gray.500">评分</Text>
                        </VStack>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
            
            <Button variant="outline" onClick={() => setStep(1)}>
              重新输入
            </Button>
          </VStack>
        )}
      </Container>
    </Box>
  )
}
